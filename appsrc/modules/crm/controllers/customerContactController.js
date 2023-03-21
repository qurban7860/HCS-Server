const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let customerDBService = require('../service/customerDBService')
this.dbservice = new customerDBService();

const { CustomerContact } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
                {path: 'customer', select: 'name'},
                {path: 'createdBy', select: 'firstName lastName'},
                {path: 'updatedBy', select: 'firstName lastName'}
                ];


exports.getCustomerContact = async (req, res, next) => {
  this.dbservice.getObjectById(CustomerContact, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getCustomerContacts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.customerId = req.params.customerId;
  this.query.customer = this.customerId; 
  this.dbservice.getObjectList(CustomerContact, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.searchCustomerContacts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  
  this.dbservice.getObjectList(CustomerContact, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};



exports.getSPCustomerContacts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};

  var aggregate = [
    {
      $lookup: {
        from: "Customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer"
      }
    },
      {
      $match: {
        "customer.type" : "SP"
      }
    }
  ];

  var params = {};
  this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, params, callbackFunc);

  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};


// exports.getSPCustomerContacts = async (req, res, next) => {
//   const { Customer } = require('../models');
//   var spFields = { _id: 1 };
//   var spQuery = { "type": "SP" };

//   this.dbservice.getObjectList(Customer, spFields, spQuery, this.orderBy, '', callbackFunc);

//   var _this = this;
//   function callbackFunc(error, response) {
//     if (error) {
//       logger.error(new Error(error));
//       res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//     } else {
//       _this.queryCustomer = {
//         customer:
//         {
//           $in:
//             response
//         }
//       };
//       _this.dbservice.getObjectList(CustomerContact, _this.fields, _this.queryCustomer, _this.orderBy, _this.populateObj, callbackFunc);
//       function callbackFunc(error, response) {
//         if (error) {
//           logger.error(new Error(error));
//           res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//         } else {
//           res.json(response);
//         }
//       }
//     }
//   }
// };

exports.deleteCustomerContact = async (req, res, next) => {
  this.dbservice.deleteObject(CustomerContact, req.params.id, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postCustomerContact = async (req, res, next) => {
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
        res.json({ customerCategory: response });
      }
    }
  }
};

exports.patchCustomerContact = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(CustomerContact, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};

function getDocumentFromReq(req, reqType){
  const { firstName, lastName, title, contactTypes, phone, email, sites, 
    isDisabled, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new CustomerContact({});
  }
  if (req.params){
    doc.customer = req.params.customerId;
  }else{
    doc.customer = req.body.customer;
  }
  if ("firstName" in req.body){
    doc.firstName = firstName;
  }
  if ("lastName" in req.body){
    doc.lastName = lastName;
  }
  if ("title" in req.body){
    doc.title = title;
  }
  if ("contactTypes" in req.body){
    doc.contactTypes = contactTypes;
  }


  if ("phone" in req.body){
    doc.phone = phone;
  }
  if ("email" in req.body){
    doc.email = email;
  }
  if ("sites" in req.body){
    doc.sites = sites;
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


exports.getDocumentFromReq = getDocumentFromReq;