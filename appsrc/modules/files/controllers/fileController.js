const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const fs = require('fs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
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
  { path: 'category', select: 'name' }
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
    try {
      if(req.file !== undefined){
        if(req.body.customer){
          const queryString = {
            customer: req.body.customer,
            ...(req.body.machine && { machine: req.body.machine }),
            ...(req.body.documentName && { documentName: req.body.documentName })
          };

          const existingFile = await File.findOne(queryString).sort({ createdAt: -1 }).limit(1);
          
          if(existingFile){
            const response = await this.dbservice.patchObject(File, existingFile._id, { isActiveVersion: false });
            req.body.documentVersion = existingFile.documentVersion + 1;
          }else{
            req.body.documentVersion = 1; 
          }
        }
        const processedFile = await processFile(req.file);
        req.body.path = processedFile.s3FilePath;
        req.body.type = processedFile.type
        req.body.extension = processedFile.fileExt;
      }else{
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
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
      const result = await this.dbservice.patchObject(File, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

async function processFile(file) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  const fileData = fs.readFileSync(file.path);
  const base64Data = fileData.toString('base64');
  
  const s3FilePath = await awsService.uploadFileS3(name, '', base64Data, fileExt);
  
  fs.unlinkSync(file.path);

  return {
    fileName: name,
    fileExt,
    s3FilePath,
    type: file.mimetype,
    physicalPath: file.path
  };
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
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }


  return doc;

}


exports.getDocumentFromReq = getDocumentFromReq;