const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const _ = require('lodash');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecuritySignInLog } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { loginTime: -1 };  
this.populate = [
  {path: '', select: ''}
];


this.populateList = [
  {path: 'user'}
];


exports.getSecuritySignInLog = async (req, res, next) => {
  this.dbservice.getObjectById(SecuritySignInLog, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecuritySignInLogs = async (req, res, next) => {
  this.dbservice.getObjectList(SecuritySignInLog, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSignInLog = async (req, res, next) => {
  this.dbservice.deleteObject(SecuritySignInLog, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.searchSignInLogs = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    this.dbservice.getObjectList(SecuritySignInLog, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    
    function callbackFunc(error, signInLogs) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {

        if(searchName) {
          let filterSignInLogs = [];
          
          for(let signInLog of signInLogs) {
            let name = signInLog.user.name.toLowerCase();
            console.log(name,searchName,name.search(searchName.toLowerCase()));
            if(name.search(searchName.toLowerCase())>-1) {
              filterSignInLogs.push(signInLog);
            }
          }

          signInLogs = filterSignInLogs;

        } 
        
        return res.status(StatusCodes.OK).json(signInLogs);
      }
    }

  }
}

exports.postSignInLog = async (req, res, next) => {
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
      } else {
        res.status(StatusCodes.CREATED).json({ SignInLog: response });
      }
    }
  }
};

exports.patchSignInLog = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchSignInLog');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecuritySignInLog, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};


function getDocumentFromReq(req, reqType){
  const { user, loginTime, logoutTime, loginIP } = req.body;

  let doc = {};
  
  if (reqType && reqType == "new"){
    doc = new SecuritySignInLog({});
  }
  if ("user" in req.body){
    doc.user = user;
  }
  if ("loginTime" in req.body){
    doc.loginTime = loginTime;
  }
  if ("logoutTime" in req.body){
    doc.logoutTime = logoutTime;
  }
  if ("loginIP" in req.body){
    doc.loginIP = loginIP;
  }

  if (reqType == "new" && "loginUser" in req.body ){
    doc.createdBy = req.body.loginUser.userId;
    doc.updatedBy = req.body.loginUser.userId;
    doc.createdIP = req.body.loginUser.userIP;
    doc.updatedIP = req.body.loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = req.body.loginUser.userId;
    doc.updatedIP = req.body.loginUser.userIP;
  } 

  return doc;
}

exports.getDocumentFromReq = getDocumentFromReq;