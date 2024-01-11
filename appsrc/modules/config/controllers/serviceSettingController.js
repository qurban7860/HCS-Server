const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../models/http-error');
const logger = require('../logger');
let rtnMsg = require('../static/static')

const ObjectId = require('mongoose').Types.ObjectId;
let configDBService = require('../service/configDBService') 
this.dbservice = new configDBService();

const { ServiceSetting } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];



exports.getConfig = async (req, res, next) => {

  if (ObjectId.isValid(req.params.id)) {
    try {
      const response = await this.dbservice.getObjectById(ServiceSetting, this.fields, req.params.id, this.populate);
      res.json(response);
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }    
  } else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
};



exports.getConfigs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const response = await this.dbservice.getObjectList(req, ServiceSetting, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteConfig = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(ServiceSetting, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postConfig = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (Object.keys(req.body).length !== 0) {
        let existingConfig = await ServiceSetting.findOne({collectionType: { $regex: req.body.collectionType.trim(), $options: 'i' }, isActive: true, isArchived: false});
        if(existingConfig){
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Collection Type already exists. Please enter a unique collection Type!', true));
        }
        const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
        res.status(StatusCodes.CREATED).json({ Config: response });
      } else {
        res.status(StatusCodes.BAD_REQUEST).send(StatusCodes.BAD_REQUEST);        
      }
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchConfig = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      let existingConfig;
      if(req.body.collectionType)
        existingConfig = await ServiceSetting.findOne({collectionType: { $regex: req.body.collectionType.trim(), $options: 'i' }, isActive: true});
      
      if(existingConfig && existingConfig._id != req.params.id){
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Collection Type already exists. Please enter a unique collection Type!', true));
      }
      const result = await this.dbservice.patchObject(ServiceSetting, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      console.log("error", error);
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { configJSON, collectionType, version, permissions, description, isActive, isArchived, loginUser} = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new ServiceSetting({});
  }
  if ("configJSON" in req.body) {
    doc.configJSON = configJSON;
  }
  if ("collectionType" in req.body) {
    doc.collectionType = collectionType;
  }
  if ("version" in req.body) {
    doc.version = version;
  }
  if ("permissions" in req.body) {
    doc.permissions = permissions;
  }
  if ("description" in req.body) {
    doc.description = description;
  }
  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
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


exports.getDocumentFromReq = getDocumentFromReq;