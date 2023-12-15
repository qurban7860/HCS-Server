const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let logDBService = require('../service/productDBService')
this.dbservice = new logDBService();

const { ProductLog } = require('../models');
const { SecurityUser } = require('../../security/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getProductLog = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(ProductLog, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getProductLogs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  

    let response = await this.dbservice.getObjectList(ProductLog, this.fields, this.query, this.orderBy, this.populate);
    
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteProductLog = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(ProductLog, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postProductLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json({ Log: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchProductLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(ProductLog, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { coilBatchName, ccThickess, coilLength, operator, frameSet, componentLabel, customer, 
  isActive, isArchived, webWidth, componentLength, loginUser, flangeHeight, profileShape, componentWeight, date,
  waste, time, machine, type } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Log({});
  }
  if ("coilBatchName" in req.body) {
    doc.coilBatchName = coilBatchName;
  }
  if ("ccThickess" in req.body) {
    doc.ccThickess = ccThickess;
  }

  if ("coilLength" in req.body) {
    doc.coilLength = coilLength;
  }

  if ("operator" in req.body) {
    doc.operator = operator;
  }

  if ("frameSet" in req.body) {
    doc.frameSet = frameSet;
  }

  if ("componentLabel" in req.body) {
    doc.componentLabel = componentLabel;
  }

  if ("webWidth" in req.body) {
    doc.webWidth = webWidth;
  }

  if ("componentLength" in req.body) {
    doc.componentLength = componentLength;
  }

  if ("componentWeight" in req.body) {
    doc.componentWeight = componentWeight;
  }

  if ("flangeHeight" in req.body) {
    doc.flangeHeight = flangeHeight;
  }

  if ("profileShape" in req.body) {
    doc.profileShape = profileShape;
  }

  if ("waste" in req.body) {
    doc.waste = waste;
  }

  if ("time" in req.body) {
    doc.time = time;
  }

  if ("date" in req.body) {
    doc.date = date;
  }

  if ("type" in req.body) {
    doc.type = type;
  }

  if ("customer" in req.body) {
    doc.customer = customer;
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
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