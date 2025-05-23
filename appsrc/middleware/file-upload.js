const multer = require('multer');
const uuid = require('uuid/v1');
const fs = require('fs');
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

const imageOptimization = async (req, res, next) => {
  try {
    const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i");
    let configObject = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true : false;
    if (req.files && req.files['images']) {
      const documents_ = req.files['images'];
      await Promise.all(documents_.map(async (docx) => {
        docx.eTag = await awsService.generateEtag(docx.path);
        if (configObject) {
          await awsService.processImageFile(docx);
        }
      }));
    }
    next();
  } catch (err) {
    ;
    logger.error(new Error(err));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


module.exports = { fileUpload, uploadHandler, checkMaxCount, imageOptimization }
