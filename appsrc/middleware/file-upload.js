const multer = require('multer');
const uuid = require('uuid/v1');
const fs = require('fs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')


const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

const fileUpload = multer({
  limits: { fileSize: process.env.MAX_FILESIZE || 500000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      console.log("destination");
      const uploadPath = process.env.UPLOAD_PATH || 'tmp/uploads';
      // create the directory if it doesn't already exist
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuid() + '.' + ext);
    }
  }),
  fileFilter: (req, file, cb) => {
    let errorMessage = '';
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    if (!isValid) {
      errorMessage = rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid mime type!', true);
      return req.res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
    }
    cb(errorMessage, isValid);
  }
});

module.exports = fileUpload;
