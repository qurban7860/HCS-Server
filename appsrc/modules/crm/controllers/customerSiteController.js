const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');

let customerDBService = require('../service/customerDBService')
this.dbservice = new customerDBService();

const { CustomerSite, Customer } = require('../models');
const { Product } = require('../../products/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'},
  {path: 'primaryBillingContact', select: 'firstName lastName'},
  {path: 'primaryTechnicalContact', select: 'firstName lastName'},
];


exports.getCustomerSite = async (req, res, next) => {
    this.dbservice.getObjectById(CustomerSite, this.fields, req.params.id, this.populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        // check if the customer id is valid
        res.json(response);
      }
    }
};

exports.getCustomerSites = async (req, res, next) => {
    this.query = req.query != "undefined" ? req.query : {};
    this.orderBy = { name: 1 };
    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.customerId = req.params.customerId;
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
  this.dbservice.deleteObject(CustomerSite, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      // get the customer first and validate
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};


exports.postCustomerSite = async (req, res, next) => {
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
        res.status(StatusCodes.CREATED).json({ CustomerSite: response });
      }
    }
  }
};

exports.patchCustomerSite = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if("isArchived" in req.body){
      // check if site exiists in customer schema
      let queryString  = { _id: req.params.customerId, mainSite: req.params.id };
      this.dbservice.getObject(Customer, queryString, this.populate, getObjectCallback);
      async function getObjectCallback(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else { 
          if(_.isEmpty(response)){
            // check if site exists in machine schema
            let queryStringMachine = { 
              $or: [{
                  instalationSite: req.params.id
                }, {
                  billingSite: req.params.id
              }]
            };
            _this.dbservice.getObject(Product, queryStringMachine, this.populate, getMachineObjectCallback);
            async function getMachineObjectCallback(error, response) {
              if (error) {
                logger.error(new Error(error));
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
              } else { 
                if(_.isEmpty(response)){ 
                  _this.dbservice.patchObject(CustomerSite, req.params.id, getDocumentFromReq(req), callbackFunc);
                  function callbackFunc(error, result) {
                    if (error) {
                      logger.error(new Error(error));
                      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
                        //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
                        );
                    } 
                    else {
                      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
                    }
                  }
                }
                else{
                  res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Machine assigned site cannot be deleted!"));
                }
              }
            }
          }
          else{
            res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Main Site cannot be deleted!"));
          }
        }
      }
    }
    else{
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
  }
};

function getDocumentFromReq(req, reqType){
  const { name, phone, email, fax, website, address, lat, long, 
    primaryBillingContact, primaryTechnicalContact, contacts,
    isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new CustomerSite({});
  }
  // get customer from params
  if (req.params){
    doc.customer = req.params.customerId;
  }else{
    doc.customer = req.body.customer;
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

  if ("lat" in req.body){
    doc.lat = lat;
  }

  if ("long" in req.body){
    doc.long = long;
  }

  if ("primaryBillingContact" in req.body){
    doc.primaryBillingContact = primaryBillingContact;
  }
  if ("primaryTechnicalContact" in req.body){
    doc.primaryTechnicalContact = primaryTechnicalContact;
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

exports.getDocumentFromReq = getDocumentFromReq;