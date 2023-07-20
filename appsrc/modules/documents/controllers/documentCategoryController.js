const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let documentDBService = require('../service/documentDBService')
this.dbservice = new documentDBService();

const { DocumentCategory, Document, DocumentType } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getDocumentCategory = async (req, res, next) => {
  try {
    let response = await this.dbservice.getObjectById(DocumentCategory, this.fields, req.params.id, this.populate);
    if(response) {
      response = JSON.parse(JSON.stringify(response))
      let docTypeQuery = { docCategory : req.params.id, isArchived:false, isActive:true };
      let docTypeFields = { name:1, description:1, customerAccess:1 }
      const documentTypes = await this.dbservice.getObjectList(DocumentType, docTypeFields, docTypeQuery, {}, []);
      response.documentTypes = documentTypes;
      res.json(response);
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentCategories = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const response = await this.dbservice.getObjectList(DocumentCategory, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteDocumentCategory = async (req, res, next) => {
  const response = await this.dbservice.getObject(Document, {category: req.params.id}, "");
  if(response === null) {
    try {
      const result = await this.dbservice.deleteObject(DocumentCategory, req.params.id);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  } else {
    res.status(StatusCodes.CONFLICT).send(rtnMsg.recordDelMessage(StatusCodes.CONFLICT, null));
  }
};

exports.postDocumentCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json({ DocumentCategory: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchDocumentCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(DocumentCategory, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { name, description, customerAccess, customer, machine, drawing,
    isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new DocumentCategory({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("description" in req.body) {
    doc.description = description;
  }
  if ("customerAccess" in req.body) {
    doc.customerAccess = customerAccess;
  }

  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if ("customer" in req.body) {
    doc.customer = customer;
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("drawing" in req.body) {
    doc.drawing = drawing;
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