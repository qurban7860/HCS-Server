const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecurityNotes } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];


exports.getSecurityNote = async (req, res, next) => {
  this.dbservice.getObjectById(SecurityNotes, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getSecurityNotes = async (req, res, next) => {
  this.userId = req.params.userId;
  this.query = req.query != "undefined" ? req.query : {};
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  this.query.user = this.userId;
  this.dbservice.getObjectList(SecurityNotes, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.searchSecurityNotes = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.dbservice.getObjectList(SecurityNotes, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};
exports.deleteSecurityNote = async (req, res, next) => {
  this.dbservice.deleteObject(SecurityNotes, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};
// exports.deleteSecurityNote = async (req, res, next) => {
//   const response = await SecurityNotes.findById(req.params.id);
//   // console.log(response, "1")
//   if(response === null) {
//     try {
//       const result = await this.dbservice.deleteObject(SecurityNotes, req.params.id, res, callbackFunc);
//       res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
//     } catch (error) {
//       logger.error(new Error(error));
//       res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//     }
//   } else {
//     res.status(StatusCodes.CONFLICT).send(rtnMsg.recordDelMessage(StatusCodes.CONFLICT, null));
//   }
// };

exports.postSecurityNote = async (req, res, next) => {
  // console.log("1")
  const errors = validationResult(req);
  // console.log("2")
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    // console.log("3")
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    // console.log("4")
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ SecurityNote: response });
      }
    }
  }
};

exports.patchSecurityNote = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecurityNotes, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};


function getDocumentFromReq(req, reqType){
  const { note, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new SecurityNotes({});
  }
  
    doc.user = req.params.userId;

  if ("note" in req.body){
    doc.note = note;
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
