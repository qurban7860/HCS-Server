const multer = require('multer');
const uuid = require('uuid/v1');
const fs = require('fs');
const { promisify } = require('util');
const convert = require('heic-convert');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const path = require('path');
const Config = require('../modules/config/models/config');
const awsService = require('../base/aws'); // Assuming you have an awsService module
const logger = require('../modules/config/logger');

const validExtensions = [
  'png',
  'jpeg',
  'jpg',
  'gif',
  'bmp',
  'webp',
  'djvu',
  'heic',
  'heif',
  'ico',
  'jfif',
  'jp2',
  'jpe',
  'jpeg',
  'jpg',
  'jps',
  'mng',
  'nef',
  'nrw',
  'orf',
  'pam',
  'pbm',
  'pcd',
  'pcx',
  'pef',
  'pes',
  'pfm',
  'pgm',
  'picon',
  'pict',
  'png',
  'pnm',
  'ppm',
  'psd',
  'raf',
  'ras',
  'rw2',
  'sfw',
  'sgi',
  'svg',
  'tga',
  'tiff',
  'psd',
  'jxr',
  'wbmp',
  'x3f',
  'xbm',
  'xcf',
  'xpm',
  'xwd',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'csv',
  'txt',
  'odp',
  'ods',
  'odt',
  'ott',
  'rtf',
  'json',
  'txt',
  'xlsm',
  // videos
  'mp4',
  'avi',
  'mov',
  'wmv',
  'flv',
  'mkv',
];

const fileUpload = multer({
  limits: { fileSize: process.env.MAX_FILESIZE || 5000000000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = process.env.UPLOAD_PATH;
      if (!uploadPath) {
        return cb(new Error('UPLOAD_PATH environment variable is not set'));
      }
      // create the directory if it doesn't already exist
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const { ext } = path.parse(file.originalname);
      let fileExt = ext.slice(1);
      if (fileExt)
        fileExt = fileExt.toLowerCase()
      cb(null, uuid() + '.' + fileExt);
    }
  }),

  fileFilter: (req, file, cb) => {
    let errorMessage = '';
    const { ext } = path.parse(file.originalname);
    let fileExt = ext.slice(1);

    if (fileExt)
      fileExt = fileExt.toLowerCase()

    const isValid = (validExtensions.indexOf(fileExt.trim())) != -1 ? true : false;
    if (!isValid) {
      errorMessage = rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid mime type!', true);
      return req.res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
    }
    cb(errorMessage, isValid);
  }
});

const uploadHandler = (req, res, next) => {
  const loginUser = req.body.loginUser
  fileUpload.fields([{ name: 'images' }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error(new Error(err));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    } else if (err) {
      logger.error(new Error(err));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
    req.body.loginUser = loginUser;
    next();
  });
};

const checkMaxCount = async (req, res, next) => {
  try {
    const regex_ = new RegExp("^MAX_UPLOAD_FILES$", "i");
    const maxCountObj = await Config.findOne({ name: regex_, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    const maxCount = maxCountObj && !isNaN(maxCountObj.value) ? parseInt(maxCountObj.value, 10) : 20;
    if (req.files && req.files['images'] && req.files['images'].length > maxCount) {
      return res.status(StatusCodes.BAD_REQUEST).send(`Number of files should not exceed ${maxCount}`);
    }
    // Store maxCount in request object for further use
    req.maxCount = maxCount;
    next();
  } catch (err) {
    logger.error(new Error(err));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

const isHeicFile = (buffer) => {
  try {
    // Check for HEIC/HEIF file signatures
    // HEIC files typically start with specific byte patterns
    if (buffer.length < 12) return false;
    
    // Check for 'ftyp' box at offset 4-8
    const ftypBox = buffer.slice(4, 8).toString('ascii');
    if (ftypBox !== 'ftyp') return false;
    
    // Check for HEIC/HEIF brand identifiers
    const brand = buffer.slice(8, 12).toString('ascii');
    const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];
    
    return heicBrands.includes(brand);
  } catch (error) {
    return false;
  }
};

const convertHeicToPng = async (file) => {
  try {
    // Read the file first to validate it
    const inputBuffer = await promisify(fs.readFile)(file.path);
    
    // Check if file is empty
    if (inputBuffer.length === 0) {
      logger.warn(`File ${file.originalname} is empty, skipping HEIC conversion`);
      return file;
    }
    
    // Validate if it's actually a HEIC file
    if (!isHeicFile(inputBuffer)) {
      logger.warn(`File ${file.originalname} has HEIC/HEIF extension but is not a valid HEIC image, skipping conversion`);
      return file;
    }
    
    // Convert to PNG
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'PNG'
    });
    
    // Generate new filename with PNG extension
    const { dir, name } = path.parse(file.path);
    const newFilename = `${name}.png`;
    const newPath = path.join(dir, newFilename);
    
    // Write the converted PNG file
    await promisify(fs.writeFile)(newPath, outputBuffer);
    
    // Remove the original HEIC/HEIF file
    await promisify(fs.unlink)(file.path);
    
    // Update file properties
    file.path = newPath;
    file.filename = newFilename;
    file.mimetype = 'image/png';
    file.originalname = file.originalname.replace(/\.(heic|heif)$/i, '.png');
    
    logger.info(`Successfully converted ${file.originalname} from HEIC/HEIF to PNG`);
    
    return file;
  } catch (error) {
    logger.error(`Error converting HEIC/HEIF file ${file.originalname}: ${error.message}`);
    
    // If conversion fails, log the error but don't throw - let the original file continue processing
    logger.warn(`Skipping HEIC conversion for ${file.originalname}, continuing with original file`);
    return file;
  }
};

const imageOptimization = async (req, res, next) => {
  try {
<<<<<<< ours
    const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i"); 
    let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); 
    configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
    
    if(req.files && req.files['images']) {
||||||| ancestor
    const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i"); 
    let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); 
    configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
    if(req.files && req.files['images']) {
=======
    const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i");
    let configObject = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true : false;
    if (req.files && req.files['images']) {
>>>>>>> theirs
      const documents_ = req.files['images'];
<<<<<<< ours
      
      await Promise.all(documents_.map(async (docx) => {
        try {
          // Check if file is HEIC or HEIF and convert to PNG
          const fileExtension = path.extname(docx.originalname).toLowerCase();
          if (fileExtension === '.heic' || fileExtension === '.heif') {
            await convertHeicToPng(docx);
          }
          
          // Generate ETag for the file (after potential conversion)
          docx.eTag = await awsService.generateEtag(docx.path);
          
          // Apply image optimization if enabled
          if(configObject){
            await awsService.processImageFile(docx);
          }
        } catch (error) {
          logger.error(`Error processing file ${docx.originalname}: ${error.message}`);
          // Don't throw here - let other files continue processing
          logger.warn(`Skipping optimization for ${docx.originalname} due to error`);
||||||| ancestor
      await Promise.all(documents_.map(async ( docx ) => {
        docx.eTag = await awsService.generateEtag(docx.path);
        if(configObject){
          await awsService.processImageFile(docx);
=======
      await Promise.all(documents_.map(async (docx) => {
        docx.eTag = await awsService.generateEtag(docx.path);
        if (configObject) {
          await awsService.processImageFile(docx);
>>>>>>> theirs
        }
      }));
    }
    next();
<<<<<<< ours
  } catch (err) {
||||||| ancestor
  } catch (err) {;
=======
  } catch (err) {
    ;
>>>>>>> theirs
    logger.error(new Error(err));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { fileUpload, uploadHandler, checkMaxCount, imageOptimization }
