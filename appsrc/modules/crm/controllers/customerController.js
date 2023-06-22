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

const { Customer, CustomerSite, CustomerContact, CustomerNote } = require('../models');
const { SecurityUser } = require('../../security/models');
const _ = require('lodash');


const customerSiteController = require('./customerSiteController');
const customerContactController = require('./customerContactController');



this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'mainSite', select: 'address name phone email fax'}, 
  {path: 'primaryBillingContact', select: 'firstName lastName'},
  {path: 'primaryTechnicalContact', select: 'firstName lastName'},
  {path: 'accountManager', select: 'firstName lastName email'},
  {path: 'projectManager', select: 'firstName lastName email'},
  {path: 'supportManager', select: 'firstName lastName email'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];


this.populateList = [
  {path: 'mainSite', select: 'address name phone email'}
];


exports.getCustomer = async (req, res, next) => {
  let validFlag = 'basic';

  if(req.params.flag && req.params.flag=='extended') {
    validFlag = req.params.flag;
  }
  this.query = req.query != "undefined" ? req.query : {};
  this.customerId = req.params.customerId;
  this.query.customer = this.customerId; 

  let populatedSites;
  let populatedContacts;
  let populatedNotes;
  let populatedVerfications;


  this.dbservice.getObjectById(Customer, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const customer = JSON.parse(JSON.stringify(response));    
      if(validFlag == 'extended'){  
        if(!(_.isEmpty(customer))) {
          if(customer.sites.length > 0){
            populatedSites = await CustomerSite.find({ _id: { $in: customer.sites } }); 
            customer.sites = [];
            customer.sites = populatedSites;       
          }

          if(customer.contacts.length > 0){
            populatedContacts = await CustomerContact.find({ _id: { $in: customer.contacts } }); 
            customer.contacts = [];
            customer.contacts = populatedContacts;
          }

          populatedNotes = await CustomerNote.find({ customer: customer._id, isActive: true, isArchived: false }); 
          if(populatedNotes.length > 0){
            customer.notes = populatedNotes;
          }

        }
      }
      console.log("customer.verifications",customer.verifications);
      if(Array.isArray(customer.verifications) && customer.verifications.length>0 ) {
        let index = 0;
        for(let verification of customer.verifications) {

          console.log("index",index);

          let user = await SecurityUser.findOne({ _id: verification.verifiedBy, isActive: true, isArchived: false }).select('name');
          console.log("user",user);
          if(user) {
            customer.verifications[index].verifiedBy = user;
          }
          else {
            customer.verifications.splice(index, 1);
          }
          index++;                
        }
      }
      res.json(customer);
    }
  } 
};

exports.getCustomers = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {}; 
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
  let customer = await Customer.findById(req.params.id); 
  if(!_.isEmpty(customer)){
    if(customer.isArchived == true && customer.type != 'SP'){
      this.dbservice.deleteObject(Customer, req.params.id, callbackFunc);
      function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } 
        else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      }
    }
    else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'SP Customers cannot be deleted!', true));
    } 
  }
  else {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));
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
            res.status(StatusCodes.CREATED).json({ Customer: response });
          }
        }
      }
    }
  }
};

exports.patchCustomer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if (("isArchived" in req.body && req.body.isArchived === true) || ("isActive" in req.body && req.body.isActive === false)) {
      let customer = await Customer.findById(req.params.id);
      if (customer.type === 'SP') {
        const message = req.body.isArchived ? 'SP Customer cannot be deleted!' : 'SP Customer cannot be deactivated!';
        return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, message, true));
      }
    }

    // ToDo correct spell mistake from front end
    if(req.body.isVerified ||req.body.isVarified){ 
      let customer = await Customer.findById(req.params.id); 
      if(!customer) {
        return res.status(StatusCodes.BAD_REQUEST).json({message:"Customer Not Found"});
      }
  
      if(!Array.isArray(customer.verifications))
        customer.verifications = [];

      for(let verif of customer.verifications) {
        if(verif.verifiedBy == req.body.loginUser.userId)
          return res.status(StatusCodes.BAD_REQUEST).json({message:"Already verified"});

      }
      customer.verifications.push({
        verifiedBy: req.body.loginUser.userId,
        verifiedDate: new Date()
      })
      customer = await customer.save();
      return res.status(StatusCodes.ACCEPTED).json(customer);
    }

    this.dbservice.patchObject(Customer, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { name, tradingName, type, siteObj, mainSite, sites, contacts,
    billingContact, primaryBillingContact, technicalContact, primaryTechnicalContact, 
    accountManager, projectManager, supportManager, 
    isActive, isArchived, loginUser } = req.body;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new Customer({});
    doc.type = "customer";
  }else{
    if ("type" in req.body){
      doc.type = type;
    }
  }

  if ("name" in req.body){
    doc.name = name;
  }
  if ("tradingName" in req.body){
    doc.tradingName = tradingName;
  }

  // if ("mainSite" in req.body){
  //   doc.mainSite = mainSite;
  // }

  // if ("technicalContact" in req.body){
  //   doc.technicalContact = technicalContact;
  // }

  // if ("billingContact" in req.body){
  //   doc.billingContact = billingContact;
  // }

  // if ("type" in req.body){
  // }

  if (reqType && reqType == "new"){
    if(mainSite != undefined && typeof mainSite !== "string") {
      var reqMainSite = {};
      reqMainSite.body = mainSite;
      doc.mainSite = customerSiteController.getDocumentFromReq(reqMainSite, 'new');
      doc.mainSite.customer = doc._id;
    }

    if(technicalContact != undefined && typeof technicalContact !== "string") {
      var reqprimaryTechnicalContact = {};
      reqprimaryTechnicalContact.body = technicalContact;
      doc.technicalContact = customerContactController.getDocumentFromReq(reqprimaryTechnicalContact, 'new');
      doc.technicalContact.customer = doc._id;
    }

    if(billingContact != undefined && typeof billingContact !== "string") {
      var reqPrimarybillingContact = {};
      reqPrimarybillingContact.body = billingContact;
      doc.billingContact = customerContactController.getDocumentFromReq(reqPrimarybillingContact, 'new');
      doc.billingContact.customer = doc._id;
    }


  }else{
    if ("mainSite" in req.body){
      doc.mainSite = mainSite;
    }

    if ("primaryBillingContact" in req.body){
      doc.primaryBillingContact = primaryBillingContact;
    }

    if ("primaryTechnicalContact" in req.body){
      doc.primaryTechnicalContact = primaryTechnicalContact;
    }
  }
  
  if ("sites" in req.body){
    doc.sites = sites;
  }

  if ("contacts" in req.body){
    doc.contacts = contacts;
  }

  if ("accountManager" in req.body){
    doc.accountManager = accountManager;
  }

  if ("projectManager" in req.body){
    doc.projectManager = projectManager;
  }

  if ("supportManager" in req.body){
    doc.supportManager = supportManager;
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