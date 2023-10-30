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

const { SecurityConfigBlockedUser, SecurityUser } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'},
  {path: 'blockedUser', select: 'name type customer'},
  {path: 'blockedCustomers', select: 'name customer roles'} 
];


this.populateList = [
  {path: 'createdBy', select: 'name'},
  {path: 'blockedUser', select: 'name type email customer'},
  {path: 'customer', select: 'name'}
];

exports.searchSecurityConfigBlockedUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    this.dbservice.getObjectList(SecurityConfigBlockedUser, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    
    function callbackFunc(error, securityConfigs) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {

        if(searchName) {
          let filtersecurityConfigUsers = [];
          
          for(let securityConfig of securityConfigs) {
            let name = securityConfig.blockedUsers.name.toLowerCase();
            if(name.search(searchName.toLowerCase())>-1) {
              filtersecurityConfigUsers.push(securityConfig);
            }
          }

          securityConfigs = filtersecurityConfigUsers;

        } 
        
        return res.status(StatusCodes.OK).json(securityConfigs);
      }
    }

  }
}


exports.getsecurityConfigBlockedUser = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.dbservice.getObjectById(SecurityConfigBlockedUser, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecurityConfigBlockedUsers = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.dbservice.getObjectList(SecurityConfigBlockedUser, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSecurityConfigBlockedUser = async (req, res, next) => {
  this.dbservice.deleteObject(SecurityConfigBlockedUser, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postSecurityConfigBlockedUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const allowedProperties = ['loginUser'];
    const invalidProperties = Object.keys(req.body).filter(prop => !allowedProperties.includes(prop));

    if (invalidProperties.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    let securityuser = await SecurityUser.findOne({_id: req.body.blockedUser, isActive:true,isArchived:false});
    
    if(securityuser && req.body.blockedUser != req.body.loginUser.userId) {
      req.body.customer = securityuser.customer;
      this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            error
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
        } else {
          res.status(StatusCodes.CREATED).json({ SecurityConfigBlockedUser: response });
        }
      }
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  }
};

exports.patchSecurityConfigBlockedUser = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchsecurityConfigUser');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecurityConfigBlockedUser, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { customer, blockedUser, loginUser, isActive, isArchived} = req.body;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new SecurityConfigBlockedUser({});
  }
  if ("blockedUser" in req.body){
    doc.blockedUser = blockedUser;
  }

  if ("customer" in req.body){
    doc.customer = customer;
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