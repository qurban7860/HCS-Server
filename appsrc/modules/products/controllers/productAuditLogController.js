const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductAuditLog } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
//this.populate = 'category';
this.populate = [
  { path: 'category', select: '_id name description' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductAuditLog = async (req, res, next) => {
  this.dbservice.getObjectById(ProductAuditLog, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductAuditLogs = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  this.dbservice.getObjectList(req, ProductAuditLog, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductAuditLog = async (req, res, next) => {
  this.dbservice.deleteObject(ProductAuditLog, req.params.id, res, callbackFunc);
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

exports.postProductAuditLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      }
    }
  }
};

exports.patchProductAuditLog = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchProductAuditLog');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(ProductAuditLog, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      }
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { recordType, customer, globelMachineID, machine, activityType, oldObject, newObject, activitySummary, activityDetail, loginUser } = req.body;
  let doc = {};
  if (reqType && reqType == "new") {
    doc = new ProductAuditLog({});
  }
  if ("recordType" in req.body) {
    doc.recordType = recordType;
  }
  if ("customer" in req.body) {
    doc.customer = customer;
  }
  if ("globelMachineID" in req.body) {
    doc.globelMachineID = globelMachineID;
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }
  if ("activityType" in req.body) {
    doc.activityType = activityType;
  }
  if ("oldObject" in req.body) {
    if (oldObject?.userInfo)
      delete oldObject.userInfo;
    if (oldObject?.loginUser)
      delete oldObject.loginUser;
    doc.oldObject = oldObject;
  }

  if ("newObject" in req.body) {
    if (newObject?.userInfo)
      delete newObject.userInfo;
    if (newObject?.loginUser)
      delete newObject.loginUser;
    doc.newObject = newObject;
  }

  // if (doc.newObject && doc.oldObject) {
  //   doc.objectDifference = jsonDiff(doc.oldObject, doc.newObject);
  // }

  if ("activitySummary" in req.body) {
    doc.activitySummary = activitySummary;
  }
  if ("activityDetail" in req.body) {
    doc.activityDetail = activityDetail;
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

function jsonDiff(obj1, obj2) {
  const result = {};

  for (const key in obj1) {
      if (obj1.hasOwnProperty(key)) {
          if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
              result[key] = obj1[key];
          }
      }
  }

  for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
          if (!obj1.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
              result[key] = obj2[key];
          }
      }
  }

  return result;
}
