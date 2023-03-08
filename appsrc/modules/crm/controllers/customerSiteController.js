const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let customerDBService = require('../service/customerDBService')
this.dbservice = new customerDBService();

const { CustomerSite } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = {path: '', select: ''};


exports.getCustomerSite = async (req, res, next) => {
    this.dbservice.getObjectById(CustomerSite, this.fields, req.params.id, this.populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json(response);
      }
    }
};

exports.getCustomerSites = async (req, res, next) => {
    this.customerId = req.params.customerId;
    this.query = req.query != "undefined" ? req.query : {};  
    this.query.customer = this.customerId; 
    this.dbservice.getObjectList(CustomerSite, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(json(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)));
      } else {
        res.json(response);
      }
    }
};

exports.searchCustomerSites = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};   
  this.dbservice.getObjectList(CustomerSite, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteCustomerSite = async (req, res, next) => {
  this.dbservice.deleteObject(CustomerSite, req.params.id, callbackFunc);
  console.log(req.params.id);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};


exports.postCustomerSite = async (req, res, next) => {
// from the body of the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        res.json({ CustomerSite: response });
      }
    }
  }
};

exports.patchCustomerSite = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(CustomerSite, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};

function getDocumentFromReq(req, reqType){
  console.log(req.body);
  const { customer, name, phone, email, fax, website, address, 
    primaryBillingContact, primaryTechnicalContact, contacts,
    isDisabled, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new CustomerSite({});
  }
  if ("customer" in req.body){
    doc.customer = customer;
  }
  if ("name" in req.body){
    doc.name = name;
  }
  if ("phone" in req.body){
    doc.phone = phone;
  }
  if ("email" in req.body){
    doc.email = email;
  }
  if ("fax" in req.body){
    doc.fax = fax;
  }
  if ("website" in req.body){
    doc.website = website;
  }
  if ("address" in req.body){
    doc.address = address;
  }
  //primaryBillingContact, primaryTechnicalContact, contacts

  if ("contacts" in req.body){
    doc.contacts = contacts;
  }

  if ("primaryBillingContact" in req.body){
    doc.primaryBillingContact = primaryBillingContact;
  }
  if ("primaryTechnicalContact" in req.body){
    doc.primaryTechnicalContact = primaryTechnicalContact;
  }
  
  if ("isDisabled" in req.body){
    doc.isDisabled = isDisabled;
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

  //console.log("doc in http req: ", doc);
  return doc;

}

exports.getDocumentFromReq = getDocumentFromReq;