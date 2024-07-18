const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');
const { render } = require('template-file');
const fs = require('fs');
const awsService = require('../../../base/aws');
const { Config } = require('../../config/models');
const path = require('path');
const sharp = require('sharp');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const { ProductServiceRecordValueFile } = require('../models');
const util = require('util');


exports.getProductServiceRecordValueFiles = async (req, res, next) => {
  const machineServiceRecord = req?.machineServiceRecord || req.params.id;

  this.query = req.query != "undefined" ? req.query : { machineServiceRecord: machineServiceRecord, isArchived: false, isActive: true };  
  if(!mongoose.Types.ObjectId.isValid(req.params.machineId))
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Machine ID"});

  this.query.machine = req.params.machineId;
  this.dbservice.getObjectList(req, ProductServiceRecordValueFile, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      console.log("error", error);
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      if( req?.machineServiceRecord ){
        res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Service Record saved with Files successfully!', false));
      }
      res.json(response);
    }
  }
};


exports.postServiceRecordValueFiles = async (req, res, next) => {
  try{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {

      if(!req.body.loginUser){
        req.body.loginUser = await getToken(req);
      }

      const machine = req.params.machineId;
      const machineServiceRecord = req.params.id;

      let files = [];
            
      if(req?.files?.images){
        files = req.files.images;
      }
      for(let file of files) {
        if(!file || !file.originalname) {
          console.log('No File present for uploading')
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }

        const processedFile = await processFile(file, req.body.loginUser.userId);
        req.body.path = processedFile.s3FilePath;
        req.body.fileType =req.body.type = processedFile.type
        req.body.extension = processedFile.fileExt;
        req.body.awsETag = processedFile.awsETag;
        req.body.eTag = processedFile.eTag;
        req.body.machine = machine;
        req.body.machineServiceRecord = machineServiceRecord;
        req.body.name = processedFile.name;
        
        if(processedFile.base64thumbNailData){
          req.body.thumbnail = processedFile.base64thumbNailData;
          req.body.name = processedFile.name;
        }

        const serviveRecordFileObject = await getServiceRecordValueFileFromReq(req, 'new');
        
        await this.dbservice.postObject(serviveRecordFileObject, callbackFunc);
        function callbackFunc(error, response) {
          if (error) {
            logger.error(new Error(error));
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          }
        }
      }
      res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Files uploaded successfully!', false));
    }
  }catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message:"Unable to save document"});
  }
};

exports.downloadServiceRecordValueFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      console.log(errors)
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
      try {
          const file = await ProductServiceRecordValueFile.findOne({_id: req.params.id}).select('path');
          if (file) {
              if (file.path && file.path !== '') {
                  const data = await awsService.fetchAWSFileInfo(file._id, file.path);
                  
                  const allowedMimeTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp',
                    'image/tiff',
                    'image/gif',
                    'image/svg'
                  ];
                
                  const isImage = file?.fileType && allowedMimeTypes.includes(file.fileType);
                  const regex = new RegExp("^OPTIMIZE_IMAGE_ON_DOWNLOAD$", "i"); 
                  let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
                  const fileSizeInMegabytes = ((data.ContentLength / 1024) / 1024);
                  console.log("fileSizeInMegabytes", fileSizeInMegabytes);
                  if (isImage && configObject && fileSizeInMegabytes > 2) {
                    console.log("OPTIMIZE_IMAGE_ON_DOWNLOAD STARTED ******** ");
                    const fileBase64 = await awsService.processAWSFile(data);
                    return res.status(StatusCodes.ACCEPTED).send(fileBase64);
                  } else {
                    return res.status(StatusCodes.ACCEPTED).send(data.Body);                    
                  }
              } else {
                  res.status(StatusCodes.NOT_FOUND).send(rtnMsg.recordCustomMessageJSON(StatusCodes.NOT_FOUND, 'Invalid file path', true));
              }
          } else {
              res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'File not found', true));
          }
      } catch (err) {
        console.log(err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
  }
};


exports.deleteServiceRecordValueFile = async (req, res, next) => {
  try {

    await this.dbservice.patchObject(ProductServiceRecordValueFile, req.params.id, getServiceRecordValueFileFromReq(req), callbackFunc);
    function callbackFunc(error, result){
      if (error) {
        console.log(error);
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
      }
    }
  } catch (error) {
    logger.error(new Error(error));
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;
  let base64fileData = null;

  if(file.buffer){
    base64fileData = file.buffer;
  } else {
    base64fileData = await readFileAsBase64(file.path);
  } 

  if(file.mimetype.includes('image')){
    thumbnailPath = await generateThumbnail(file.path);
    if(thumbnailPath)
      base64thumbNailData = await readFileAsBase64(thumbnailPath);
  }
  const fileName = userId+"-"+new Date().getTime();
  const s3Data = await awsService.uploadFileS3(fileName, 'uploads', base64fileData, fileExt);
  s3Data.eTag = await awsService.generateEtag(file.path);
  fs.unlinkSync(file.path);
  if(thumbnailPath){
    fs.unlinkSync(thumbnailPath);
  }
  if (!s3Data || s3Data === '') {
    throw new Error('AWS file saving failed');
  } else {
    return {
      fileName,
      name,
      fileExt,
      s3FilePath: s3Data.Key, 
      awsETag: s3Data.awsETag,
      eTag: s3Data.eTag,
      type: file.mimetype,
      physicalPath: file.path,
      base64thumbNailData
    };
  }
}

async function readFileAsBase64(filePath) {
  try {
    const fileData = await fs.promises.readFile(filePath);
    const base64Data = fileData.toString('base64');
    return base64Data;
  } catch (error) {
    console.log('Error reading file as base64:', error);
    throw error;
  }
}

async function generateThumbnail(filePath) {
  try {
    const thumbnailSize = 80;
    const thumbnailPath = getThumbnailPath(filePath);     
    await sharp(filePath)
      .resize(thumbnailSize, null)
      .toFile(thumbnailPath);
    return thumbnailPath;
    
  } catch (error) {
    console.log(error);
  }
}

function getThumbnailPath(filePath) {
  const thumbnailName = path.basename(filePath, path.extname(filePath)) + '_thumbnail.png';
  return path.join(process.env.UPLOAD_PATH, thumbnailName);
}

async function getToken(req){
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:'';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

function getServiceRecordValueFileFromReq(req, reqType) {

  const { serviceRecord, serviceId, machineCheckItem, checkItemListId, path, extension, name, machine, fileType, awsETag, eTag, thumbnail, user, isActive, isArchived, loginUser } = req.body;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new ProductServiceRecordValueFile({});
  }

  if ("serviceRecord" in req.body) {
    doc.serviceRecord = serviceRecord;
  }

  if ("serviceId" in req.body) {
    doc.serviceId = serviceId;
  }

  if ("machineCheckItem" in req.body) {
    doc.machineCheckItem = machineCheckItem;
  }

  if ("checkItemListId" in req.body) {
    doc.checkItemListId = checkItemListId;
  }

  if ("name" in req.body) {
    doc.name = name;
  }

  if ("path" in req.body) {
    doc.path = path;
  }

  if ("extension" in req.body) {
    doc.extension = extension;
  }

  if ("thumbnail" in req.body) {
    doc.thumbnail = thumbnail;
  }

  if ("fileType" in req.body) {
    doc.fileType = fileType;
  }

  if ("awsETag" in req.body) {
    doc.awsETag = awsETag;
  }

  if ("eTag" in req.body) {
    doc.eTag = eTag;
  }
  
  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if ("user" in req.body) {
    doc.user = user;
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body) {
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }
  return doc;
}

