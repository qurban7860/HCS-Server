const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const _ = require('lodash');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const _ = require('lodash');

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecurityUser } = require('../models');
const { Customer } = require('../../crm/models');
const { Machine } = require('../../machines/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'customer', select: 'name'},
  {path: 'contact', select: 'firstName lastName'},
  {path: 'roles', select: 'name'},
];

this.populateList = [
  {path: 'customer', select: 'name'},
  {path: 'contact', select: 'firstName lastName'},
  {path: 'roles', select: 'name'},
];


exports.getSecurityUser = async (req, res, next) => {
  this.dbservice.getObjectById(SecurityUser, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecurityUsers = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.dbservice.getObjectList(SecurityUser, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSecurityUser = async (req, res, next) => {

  let user = await SecurityUser.findById(req.params.id); 
  if(!(_.isEmpty(user)) && user.isArchived) {
    
    let customer = await Customer.findOne({createdBy:user.id});
    let machine = await Machine.findOne({createdBy:user.id});

    if(!customer && !machine) {
      this.dbservice.deleteObject(SecurityUser, req.params.id, (error, result)=>{
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      });
    }
    else {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  }
  else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
};

exports.postSecurityUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } 
  else {
    // check if email exists
    var _this = this;
    let queryString  = { email: req.body.email};
    this.dbservice.getObject(SecurityUser, queryString, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        if(_.isEmpty(response)){
          const doc = await getDocumentFromReq(req, 'new');
          _this.dbservice.postObject(doc, callbackFunc);
          function callbackFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
            } else {
              res.status(StatusCodes.CREATED).json({ user: response });
            }
          }  
        }else{
          res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST));              
        }
      }
    }
  }
};

exports.patchSecurityUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    // check if email already exists
    var _this = this;
    let queryString  = { email: req.body.email};
    this.dbservice.getObject(SecurityUser, queryString, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        // check if theres any other user by the same email
        if(!(_.isEmpty(response)) && (response._id != req.params.id)){
          // return error message
          res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST))       
        }else{
            const doc = await getDocumentFromReq(req);
            _this.dbservice.patchObject(SecurityUser, req.params.id, doc, callbackFunc);
            function callbackFunc(error, result) {
              if (error) {
                logger.error(new Error(error));
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
              } else {
                res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
              }
            }     
        }
      }
    }
  }
};


async function getDocumentFromReq(req, reqType){
  const { customer, contact, name, phone, email, login,
     password, expireAt, roles, isActive, isArchived } = req.body;


  let doc = {};
  
  if (reqType && reqType == "new"){
    doc = new SecurityUser({});
  }
  if ("customer" in req.body){
    doc.customer = customer;
  }
  if ("contact" in req.body){
    doc.contact = contact;
  }
  if ("name" in req.body){
    doc.name = name;
  }

  if ("phone" in req.body){
    doc.phone = phone;
  }

  if ("password" in req.body) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      doc.password = hashedPassword;
    } catch (error) {
      logger.error(new Error(error));
      throw new Error(error);
    }
  }

  if ("login" in req.body){
    doc.login = login;
  }

  if ("email" in req.body){
    doc.email = email;
  }

  if ("expireAt" in req.body){
    doc.expireAt = expireAt;
  }

  if ("roles" in req.body){
    doc.roles = roles;
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
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  return doc;
}