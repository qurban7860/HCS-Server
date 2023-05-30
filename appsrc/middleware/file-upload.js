const multer = require('multer');
const uuid = require('uuid/v1');
const fs = require('fs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const path = require('path');


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
  'txt'
];

const fileUpload = multer({
  limits: { fileSize: process.env.MAX_FILESIZE || 5000000000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = process.env.UPLOAD_PATH;
      // create the directory if it doesn't already exist
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // const ext = validExtensions[file.mimetype];
      const { ext } = path.parse(file.originalname);
      let fileExt = ext.slice(1);
      if(fileExt)
        fileExt = fileExt.toLowerCase()
      cb(null, uuid() + '.' + fileExt);
    }
  }),
  fileFilter: (req, file, cb) => {
    let errorMessage = '';
    // const isValid = !!validExtensions[file.mimetype];
    const { ext } = path.parse(file.originalname);
    let fileExt = ext.slice(1);

    if(fileExt)
      fileExt = fileExt.toLowerCase()
    
    const isValid = (validExtensions.indexOf(fileExt.trim())) != -1 ? true : false;
    if (!isValid) {
      errorMessage = rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid mime type!', true);
      return req.res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
    }
    cb(errorMessage, isValid);
  }
});

module.exports = fileUpload;
