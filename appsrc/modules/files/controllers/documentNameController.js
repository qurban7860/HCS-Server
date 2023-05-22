const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let fileDBService = require('../service/fileDBService')
this.dbservice = new fileDBService();

const { File, DocumentName } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getDocumentName = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(DocumentName, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentNames = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectList(DocumentName, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentFiles = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const queryString = { documentName: req.params.id };
      const response = await this.dbservice.getObjectList(File, this.fields, { documentName : req.params.id }, this.orderBy, this.populate);
      res.json(response);
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  }
};

exports.deleteDocumentName = async (req, res, next) => {
  const response = await this.dbservice.getObject(File, {documentname: req.params.id}, "");
  if(response === null) {
    try {
      const result = await this.dbservice.deleteObject(DocumentName, req.params.id);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  } else {
    res.status(StatusCodes.CONFLICT).send(rtnMsg.recordDelMessage(StatusCodes.CONFLICT, null));
  }
};


exports.postDocumentName = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json({ DocumentName: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchDocumentName = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(DocumentName, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { name, description, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new DocumentName({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("description" in req.body) {
    doc.description = description;
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