const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const _ = require('lodash');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
var ObjectId = require('mongoose').Types.ObjectId;
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecurityConfigBlackListIP } = require('../models');



this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'} 
];


this.populateList = [
  {path: '', select: ''}
];

exports.searchSecurityConfigBlackListIP = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    this.dbservice.getObjectList(SecurityConfigBlackListIP, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    
    function callbackFunc(error, securityConfigs) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {

        if(searchName) {
          let filterSecurityConfigBlackListIPs = [];
          
          for(let securityConfig of securityConfigs) {
            let name = securityConfig.blockedUsers.name.toLowerCase();
            if(name.search(searchName.toLowerCase())>-1) {
              filterSecurityConfigBlackListIPs.push(securityConfig);
            }
          }

          securityConfigs = filterSecurityConfigBlackListIPs;

        } 
        
        return res.status(StatusCodes.OK).json(securityConfigs);
      }
    }

  }
}


exports.getSecurityConfigBlackListIP = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.dbservice.getObjectById(SecurityConfigBlackListIP, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecurityConfigBlackListIPs = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  console.log("here....");
  this.dbservice.getObjectList(SecurityConfigBlackListIP, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSecurityConfigBlackListIP = async (req, res, next) => {
  this.dbservice.deleteObject(SecurityConfigBlackListIP, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postSecurityConfigBlackListIP = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const allowedProperties = ['loginUser'];
    const invalidProperties = Object.keys(req.body).filter(prop => !allowedProperties.includes(prop));

    if (invalidProperties.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ SecurityConfigBlackListIP: response });
      }
    }
  }
};

exports.patchSecurityConfigBlackListIP = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchSecurityConfigBlackListIP');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecurityConfigBlackListIP, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { blackListIPs, loginUser, isActive, isArchived} = req.body;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new SecurityConfigBlackListIP({});
  }

  if ("blackListIPs" in req.body){
    doc.blackListIPs = blackListIPs;
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

  return doc;
}