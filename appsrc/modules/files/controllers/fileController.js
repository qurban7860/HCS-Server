const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const path = require('path');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const fs = require('fs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const awsService = require('../../../../appsrc/base/aws');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let fileDBService = require('../service/fileDBService')
this.dbservice = new fileDBService();

const { File } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'documentName', select: 'name' },
  { path: 'category', select: 'name' },
  { path: 'customer', select: 'name' }
];



exports.getFile = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(File, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getFiles = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const response = await this.dbservice.getObjectList(File, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(File, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    if(!req.body.loginUser || req.body.loginUser=='undefined'){
      req.body.loginUser = await getToken(req);
    }

    try {
      if(req.file !== undefined){
        if(req.body.customer){
          const queryString = {
            customer: req.body.customer,
            machine: req.body.machine ? req.body.machine : null,
            documentName: req.body.documentName ? req.body.documentName : null
          };

          const existingFile = await File.findOne(queryString).sort({ createdAt: -1 }).limit(1);
          
          if(existingFile && req.body.documentName){
            const result = await this.dbservice.patchObject(File, existingFile._id, { isActiveVersion: false });
            if(result){
              req.body.documentVersion = existingFile.documentVersion + 1;
            }
          }else{
            req.body.documentName ? req.body.documentVersion = 1 : req.body.documentVersion = 0;
          }
        }

        const processedFile = await processFile(req.file, req.body.loginUser.userId);
        req.body.path = processedFile.s3FilePath;
        req.body.type = processedFile.type
        req.body.extension = processedFile.fileExt;
        req.body.content = processedFile.base64thumbNailData;
        
        req.body.name = processedFile.fileName;
        console.log("fileName", processedFile.fileName);
        if(!req.body.displayName || req.body.displayName == ''){
          req.body.displayName = processedFile.name;
        }

      } else{
        return res.status(StatusCodes.BAD_REQUEST).json({ error: getReasonPhrase(StatusCodes.BAD_REQUEST) });
      }
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json({ File: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if("documentVersion" in req.body){
        res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Document Version cannot be updated', true));
      }else{
        const result = await this.dbservice.patchObject(File, req.params.id, getDocumentFromReq(req));
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.downloadFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const file = await this.dbservice.getObjectById(File, this.fields, req.params.id, this.populate);
      if(file){
        if (file.path && file.path !== '') {
          const fileContent = await awsService.downloadFileS3(file.path);
          console.log("fileContent",fileContent);
          return res.status(StatusCodes.ACCEPTED).send(fileContent);
        }else{
          res.status(StatusCodes.NOT_FOUND).send(rtnMsg.recordCustomMessageJSON(StatusCodes.NOT_FOUND, 'Invalid file path', true));
        }
      }else{
        res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'File not found', true));
      }
    }
    catch(err){
      return err;
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
  return path.join('tmp/uploads', thumbnailName);
}

async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;

  const base64fileData = await readFileAsBase64(file.path);

  if(file.mimetype.includes('image')){
    thumbnailPath = await generateThumbnail(file.path);
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

function getDocumentFromReq(req, reqType) {
  const { name, displayName, description, path, type, extension, content, 
    documentName, documentVersion, category, customer, customerAccess, site,
    contact, user, machine, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new File({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("displayName" in req.body) {
    doc.displayName = displayName;
  }
  if ("description" in req.body) {
    doc.description = description;
  }
  if ("path" in req.body) {
    doc.path = path;
  }
  if ("type" in req.body) {
    doc.type = type;
  }
  if ("extension" in req.body) {
    doc.extension = extension;
  }
  if ("documentName" in req.body) {
    doc.documentName = documentName;
  }
  if ("documentVersion" in req.body) {
    doc.documentVersion = documentVersion;
  }
  if ("category" in req.body) {
    doc.category = category;
  }
  if ("content" in req.body) {
    doc.content = content;
  }
  if ("customer" in req.body) {
    doc.customer = customer;
  }
  if ("customerAccess" in req.body) {
    doc.customerAccess = customerAccess;
  }
  if ("site" in req.body) {
    doc.site = site;
  }
  if ("contact" in req.body) {
    doc.contact = contact;
  }
  if ("user" in req.body) {
    doc.user = user;
  }
  if ("machine" in req.body) {
    doc.machine = machine;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
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


exports.getDocumentFromReq = getDocumentFromReq;