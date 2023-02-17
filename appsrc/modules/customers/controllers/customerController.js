const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
var ObjectId = require('mongoose').Types.ObjectId;
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let customerDBService = require('../service/customerDBService')
this.dbservice = new customerDBService();

const { Customer } = require('../models');

const { CustomerSite } = require('../models');


const customerSiteController = require('../controllers/customerSiteController');
const customerContactController = require('../controllers/customerContactController');



this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };  
this.populate = [
  {path: 'mainSite', select: 'address name phone email'}, 
  {path: 'primaryBillingContact', select: 'firstName'},

  {path: 'accountManager', select: 'firstName lastName email'},
  {path: 'projectManager', select: 'firstName lastName email'},
  {path: 'supportManager', select: 'firstName lastName email'},
];


this.populateList = [
  {path: 'mainSite', select: 'address name phone email'}
];


exports.getCustomer = async (req, res, next) => {
  this.dbservice.getObjectById(Customer, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getCustomers = async (req, res, next) => {
  this.dbservice.getObjectList(Customer, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteCustomer = async (req, res, next) => {
  this.dbservice.deleteObject(Customer, req.params.id, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postCustomer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    var _this = this;
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        _this.dbservice.getObjectById(Customer, _this.fields, response._id, _this.populate, callbackFunc);
        function callbackFunc(error, response) {
          if (error) {
            logger.error(new Error(error));
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
          } else {
            res.json({ Customer: response });
          }
        }
      }
    }
  }
};

exports.patchCustomer = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchCustomer');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(Customer, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { name, tradingName, type, site, mainSite, sites, contacts,
    billingContact, primaryBillingContact, technicalContact, primaryTechnicalContact, 
    accountManager, projectManager, supportManager, 
    isDisabled, isArchived, loginUser } = req.body;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new Customer({});
  }
  if ("name" in req.body){
    doc.name = name;
  }
  if ("tradingName" in req.body){
    doc.tradingName = tradingName;
  }
  if ("type" in req.body){
    doc.type = type;
  }

  if ("mainSite" in req.body){
    doc.mainSite = mainSite;
  }

  if ("site" in req.body){
    doc.site = site;
  }


  //console.log("doc.site", doc.site);
  if(doc.site != undefined && typeof doc.site !== "string") {
    var reqMainSite = {};
    reqMainSite.body = site;
    doc.site = customerSiteController.getDocumentFromReq(reqMainSite, 'new');
    doc.site.customer = doc._id;
  }
  
  if ("sites" in req.body){
    doc.sites = sites;
  }

  if ("contacts" in req.body){
    doc.contacts = contacts;
  }

  if ("primaryBillingContact" in req.body){
    doc.primaryBillingContact = primaryBillingContact;
  }

  if ("billingContact" in req.body){
    doc.billingContact = billingContact;
  }

  if(doc.billingContact != undefined && typeof billingContact !== "string") {
    var reqPrimaryBillingContact = {};
    reqPrimaryBillingContact.body = billingContact;
    doc.billingContact = customerContactController.getDocumentFromReq(reqPrimaryBillingContact, 'new');
    doc.billingContact.customer = doc._id;
  }
  
  if ("primaryTechnicalContact" in req.body){
    doc.primaryTechnicalContact = primaryTechnicalContact;
  }

  if ("technicalContact" in req.body){
    doc.technicalContact = technicalContact;
  }

  if(doc.technicalContact != undefined && typeof technicalContact !== "string") {
    var reqprimaryTechnicalContact = {};
    reqprimaryTechnicalContact.body = technicalContact;
    doc.technicalContact = customerContactController.getDocumentFromReq(reqprimaryTechnicalContact, 'new');
    doc.technicalContact.customer = doc._id;
  }

  if ("accountManager" in req.body && ObjectId.isValid(accountManager)){
    doc.accountManager = accountManager;
  }

  if ("projectManager" in req.body && ObjectId.isValid(projectManager)){
    doc.projectManager = projectManager;
  }

  if ("supportManager" in req.body && ObjectId.isValid(supportManager)){
    doc.supportManager = supportManager;
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

  return doc;
}