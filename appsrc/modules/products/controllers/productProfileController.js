const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const path = require('path');
const fs = require('fs');
const awsService = require('../../../base/aws');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductProfile } = require('../models');

// File processing functions
async function readFileAsBase64(filePath) {
  try {
    const fileData = await fs.promises.readFile(filePath);
    const base64Data = fileData.toString('base64');
    return base64Data;
  } catch (error) {
    logger.error(new Error('Error reading file as base64'));
    logger.error(new Error(error));
    throw error;
  }
}

async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;

  let base64fileData = null;
  if(file.buffer)
    base64fileData = file.buffer;
  else 
    base64fileData = await readFileAsBase64(file.path);

  if(file.mimetype.includes('image')){
    thumbnailPath = await generateThumbnail(file.path);
    if(thumbnailPath) {
      base64thumbNailData = await readFileAsBase64(thumbnailPath);
    }
  }
  
  const fileName = userId+"-"+new Date().getTime();
  const s3Data = await awsService.uploadFileS3(fileName, 'uploads', base64fileData, fileExt);
  s3Data.eTag = await awsService.generateEtag(file.path);
  try{
    fs.unlinkSync(file.path);
    if(thumbnailPath){
      fs.unlinkSync(thumbnailPath);
    }
  } catch ( error ) {
    logger.error(new Error("Exception while deleting image "));
    logger.error(new Error( error ));
  }

  if (!s3Data || s3Data === '') {
    throw new Error('AWS file saving failed');
  }
  else{
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

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductProfile = async (req, res, next) => {
  this.dbservice.getObjectById(ProductProfile, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductProfiles = async (req, res, next) => {
  this.machineId = req.params.machineId;
  this.query = req.query != "undefined" ? req.query : {};  
  this.query.machine = this.machineId;
  this.orderBy = { createdAt: -1 };
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }

  this.dbservice.getObjectList(req, ProductProfile, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductProfile = async (req, res, next) => {
  this.dbservice.deleteObject(ProductProfile, req.params.id, res, callbackFunc);
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

exports.postProductProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {

      let files = [];
      if(req.files && req.files.images) {
        files = req.files.images;
      }

      let productProfile = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      
      if (!productProfile) {
        logger.error(new Error("Product profile save failed"));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Product profile save failed");
      }

      if (Array.isArray(files) && files.length > 0) {
        let processedFiles = [];
        
        for(let file of files) {
          if(file && file.originalname) {
            try {
              const processedFile = await processFile(file, req.body.loginUser.userId);
              processedFiles.push({
                name: processedFile.name,
                path: processedFile.s3FilePath,
                type: processedFile.type,
                extension: processedFile.fileExt,
                awsETag: processedFile.awsETag,
                eTag: processedFile.eTag,
                thumbnail: processedFile.base64thumbNailData
              });
            } catch (error) {
              logger.error(new Error("File processing failed"));
              logger.error(new Error(error));
            }
          }
        }

        if (processedFiles.length > 0) {
          productProfile.files = processedFiles;
          productProfile = await productProfile.save();
        }
      }

      return res.status(StatusCodes.CREATED).json({ ProductProfile: productProfile });
    }
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message || "Unable to save product profile");
  }
};

exports.patchProductProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {

      let productProfile = await ProductProfile.findById(req.params.id);
      if (!productProfile) {
        return res.status(StatusCodes.NOT_FOUND).send("Product profile not found");
      }

      let files = [];
      if(req.files && req.files.images) {
        files = req.files.images;
      }

      if (Array.isArray(files) && files.length > 0) {
        let processedFiles = [];
        
        for(let file of files) {
          if(file && file.originalname) {
            try {
              const processedFile = await processFile(file, req.body.loginUser.userId);
              processedFiles.push({
                name: processedFile.name,
                path: processedFile.s3FilePath,
                type: processedFile.type,
                extension: processedFile.fileExt,
                awsETag: processedFile.awsETag,
                eTag: processedFile.eTag,
                thumbnail: processedFile.base64thumbNailData
              });
            } catch (error) {
              logger.error(new Error("File processing failed"));
              logger.error(new Error(error));
            }
          }
        }

        if (req.body.replaceFiles === true || req.body.replaceFiles === 'true') {
          productProfile.files = processedFiles;
        } else {
          if (!productProfile.files) {
            productProfile.files = [];
          }
          productProfile.files = productProfile.files.concat(processedFiles);
        }
      } else if (req.body.files === null || (Array.isArray(req.body.files) && req.body.files.length === 0)) {
        productProfile.files = [];
      }

      const updateData = getDocumentFromReq(req);
      Object.keys(updateData).forEach(key => {
        if (key !== 'files') {
          productProfile[key] = updateData[key];
        }
      });

      try {
        const updatedProfile = await productProfile.save();
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, updatedProfile));
      } catch (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      }
    }
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message || "Unable to update product profile");
  }
};

function getDocumentFromReq(req, reqType){
  const { machine, defaultName, names, flange, type, web, thicknessStart, thicknessEnd, isActive, isArchived, loginUser, files} = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductProfile({});
  }

  if ("machine" in req.body){
    doc.machine = req.body.machine;
  }else{
    doc.machine = req.params.machineId;
  }

  if ("type" in req.body){
    doc.type = type;
  }
  
  if ("defaultName" in req.body){
    doc.defaultName = defaultName;
  }
  
  if ("names" in req.body){
    doc.names = names;
  }
  
  if ("flange" in req.body){
    doc.flange = flange;
  }
  
  if ("web" in req.body){
    doc.web = web;
  }
  
  if ("thicknessStart" in req.body){
    doc.thicknessStart = thicknessStart;
  }

  if ("thicknessEnd" in req.body){
    doc.thicknessEnd = thicknessEnd;
  }
  
  if ("isActive" in req.body){
    doc.isActive = req.body.isActive === true || req.body.isActive === 'true' ? true : false;
  }

  if ("isArchived" in req.body){
    doc.isArchived = req.body.isArchived === true || req.body.isArchived === 'true' ? true : false;
  }

  if ("files" in req.body && !req.files) {
    doc.files = files;
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

  return doc;
}
