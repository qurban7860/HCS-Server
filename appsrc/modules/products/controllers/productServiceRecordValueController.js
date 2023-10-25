const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const fs = require('fs');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const awsService = require('../../../../appsrc/base/aws');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceRecordValue } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: '<field name>', model: '<model name>', select: '<space separated field names>'};


exports.getProductServiceRecordValue = async (req, res, next) => {
  this.dbservice.getObjectById(ProductServiceRecordValue, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductServiceRecordValues = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { name: 1 };
  this.dbservice.getObjectList(ProductServiceRecordValue, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductServiceRecordValue = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceRecordValue, req.params.id, res, callbackFunc);
  //console.log(req.params.id);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductServiceRecordValue = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let alreadyExists = await ProductServiceRecordValue.findOne({name:req.body.name});
    if(alreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Product Supplier with this name alreadyExists');
    }

    if(!req.body.loginUser){
      req.body.loginUser = await getToken(req);
    }

    let file = {};
        
    if(req.files && req.files.document)
      file = req.files.document[0];

    if(req.file && req.file.document)
      file = req.file.document;

    if(file && file.originalname) {
        
      const processedFile = await processFile(file, req.body.loginUser.userId);
      file.path = processedFile.s3FilePath;
      file.fileType  = processedFile.type
      file.extension = processedFile.fileExt;
      
      if(processedFile.base64thumbNailData)
        file.thumbnail = processedFile.base64thumbNailData;

      file.name = processedFile.name;
      req.body.files = [file];
    }
    

    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ ProductServiceRecordValue: response });
      }
    }
  }
};

exports.patchProductServiceRecordValue = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchProductServiceRecordValue');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let alreadyExists = await ProductServiceRecordValue.findOne({name:req.body.name,_id:{$ne:req.params.id}});
    if(alreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Product Supplier with this name alreadyExists');
    }

     if(!req.body.loginUser){
      req.body.loginUser = await getToken(req);
    }

    let file = {};
        
    if(req.files && req.files.document)
      file = req.files.document[0];

    if(req.file && req.file.document)
      file = req.file.document;

    if(file && file.originalname) {
        
      const processedFile = await processFile(file, req.body.loginUser.userId);
      file.path = processedFile.s3FilePath;
      file.fileType  = processedFile.type
      file.extension = processedFile.fileExt;
      
      if(processedFile.base64thumbNailData)
        file.thumbnail = processedFile.base64thumbNailData;

      file.name = processedFile.name;
      req.body.files = [file];
    }

    
    this.dbservice.patchObject(ProductServiceRecordValue, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};


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

async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;

  const base64fileData = await readFileAsBase64(file.path);

  if(file.mimetype.includes('image')){
    thumbnailPath = await generateThumbnail(file.path);
    if(thumbnailPath)
      base64thumbNailData = await readFileAsBase64(thumbnailPath);
  }
  
  const fileName = userId+"-"+new Date().getTime();
  const s3FilePath = await awsService.uploadFileS3(fileName, 'uploads', base64fileData, fileExt);

  fs.unlinkSync(file.path);
  if(thumbnailPath){
    fs.unlinkSync(thumbnailPath);
  }
  
  if (!s3FilePath || s3FilePath === '') {
    throw new Error('AWS file saving failed');
  }
  else{
    return {
      fileName,
      name,
      fileExt,
      s3FilePath,
      type: file.mimetype,
      physicalPath: file.path,
      base64thumbNailData
    };
  }
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

function getDocumentFromReq(req, reqType){
  const { serviceParam, serviceRecord, name, ListTitle, checked, value, status, comments, date,
    files, category, isRequired, inputType, unitType, minValidation, maxValidation,isArchived, 
    loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordValue({});
  }

  if ("serviceRecord" in req.body) {
    doc.serviceRecord = serviceRecord;
  }

  if ("serviceParam" in req.body) {
    doc.serviceParam = serviceParam;
  }
  
  if ("name" in req.body) {
    doc.name = name;
  }
  
  if ("ListTitle" in req.body) {
    doc.ListTitle = ListTitle;
  }
  
  if ("checked" in req.body) {
    doc.checked = checked;
  }
  
  if ("value" in req.body) {
    doc.value = value;
  }
  
  if ("status" in req.body) {
    doc.status = status;
  }
  
  if ("comments" in req.body) {
    doc.comments = comments;
  }
  
  if ("date" in req.body) {
    doc.date = date;
  }
  
  if ("files" in req.body) {
    doc.files = files;
  }

  if ("category" in req.body) {
    doc.category = category;
  }

  if ("isRequired" in req.body) {
    doc.isRequired = isRequired;
  }

  if ("unitType" in req.body) {
    doc.unitType = unitType;
  }

  if ("inputType" in req.body) {
    doc.inputType = inputType;
  }

  if ("minValidation" in req.body) {
    doc.minValidation = minValidation;
  }

  if ("maxValidation" in req.body) {
    doc.maxValidation = maxValidation;
  }

  if ("isActive" in req.body){
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}
