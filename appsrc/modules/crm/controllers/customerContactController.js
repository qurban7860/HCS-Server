const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer, CustomerSite, CustomerContact } = require('../models');
const { Config } = require('../../config/models');
const { MachineServiceRecord } = require('../../products/models');


const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let customerDBService = require('../service/customerDBService')
this.dbservice = new customerDBService();
const ObjectId = require('mongoose').Types.ObjectId;

const fs = require('fs');
const path = require('path');



this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;


this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
                {path: 'customer', select: 'name'},
                {path: 'department', select: 'departmentName'},
                {path: 'reportingTo', select: 'firstName lastName'},
                {path: 'createdBy', select: 'name'},
                {path: 'updatedBy', select: 'name'}
                ];


exports.getCustomerContact = async (req, res, next) => {
  this.dbservice.getObjectById(CustomerContact, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      let isOperator = await MachineServiceRecord.findOne( { operators : response._id } ).select('_id');
      
      if(isOperator) {
        response = JSON.parse(JSON.stringify(response));
        response.isOperator = true;
      }
      else
        response.isOperator = false;

      res.json(response);
    }
  }

};

exports.getCustomerContacts = async (req, res, next) => {
  this.orderBy = {firstName: 1, lastName: 1};
  this.query = req.query != "undefined" ? req.query : {};
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  this.customerId = req.params.customerId;
  this.query.customer = this.customerId; 
  this.dbservice.getObjectList(CustomerContact, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      response = JSON.parse(JSON.stringify(response));
      let index = 0;
      for(let contact of response) {
        let isOperator = await MachineServiceRecord.findOne( { operators : contact._id } ).select('_id');
        
        if(isOperator) 
          contact.isOperator = true;
        else 
          contact.isOperator = false;

        response[index] = contact; 
      }

      res.json(response);
    }
  }
};

exports.searchCustomerContacts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  if(this.query.customerArr){
    const customerIds = JSON.parse(this.query.customerArr);
    this.query.customer = { $in: customerIds };
    delete this.query.customerArr;
  }
  
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
        "customer.type" : "SP",
        "customer.isActive" : true,
        "customer.isArchived" : false
          
          
        
      }
    },
    {
      $sort: {
        "firstName" : 1,
        "lastName" : 1
      }
    },
      {
    $lookup: {
      from: "CustomerContacts",
      localField: "_id",
      foreignField: "_id",
      as: "contact"
    }
  },
  {
    $match: {
      "contact.isActive": true,
      "contact.isArchived": false
        
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


exports.moveContact = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } 
  else {
    if(ObjectId.isValid(req.params.customerId)) {
      let customer = await Customer.findOne({ _id : req.params.customerId, isActive : true, isArchived : false });
      let contact = await CustomerContact.findOne({ _id : req.body.contact, isActive : true, isArchived : false }).populate('customer');
      // let sites = await CustomerSite.find({_id:{$in:req.body.sites}, isActive : true, isArchived : false });


      if(contact && contact.customer && contact.customer.type && contact.customer.type != 'SP') {
        
        if (!customer || !contact ) 
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, Customer));

        if (!contact || 
          (contact.customer && 
            (contact.customer.primaryBillingContact==contact._id || contact.customer.primaryTechnicalContact==contact._id))) 
          return res.status(StatusCodes.BAD_REQUEST).send('Contact Not found or its used in a customer');

        // if(contact.customer && req.body.sites.indexOf(contact.customer.mainSite)>-1) {
        //   return res.status(StatusCodes.BAD_REQUEST).send('Contact Site is used as main site of customer');
        // }

        // sites = sites.map( (s) => s._id );
        
        contact.customer = customer;
        contact.sites = [];
      
        contact = await contact.save();
        
        return res.status(StatusCodes.OK).json({ Contact: contact });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(contact ? "Service provider contact can't be moved!":"Contact not found!");
      }
    } 
    else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
    }
  }

};

exports.deleteCustomerContact = async (req, res, next) => {
  let id = req.params.id;
  let customerId = req.params.customerId;
  
  if(req.params.id && req.params.customerId) {
    let customerContact = await CustomerContact.findOne({_id:req.params.id, customer:req.params.customerId});
    
    if(customerContact) {

      this.dbservice.deleteObject(CustomerContact, req.params.id, res, callbackFunc);
      function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      }
    }
    else {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  }
  else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
};

exports.postCustomerContact = async (req, res, next) => {
  await body('email')
  .optional()
  .custom((value, { req }) => {
    if (!value || value.trim() === '') {
      return true;
    } else {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      // return validator.isEmail(value);
    }
  })
  .withMessage('Invalid email format')
  .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.errors.forEach(error => {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, error.msg));
    });
  } else {
    if(req.body.reportingTo) {
      if(ObjectId.isValid(req.body.reportingTo)) {
        let reportToContact = await CustomerContact.findOne({_id: req.body.reportingTo, customer: req.params.customerId});
        if(!reportToContact || _.isEmpty(reportToContact)) {
          return res.status(StatusCodes.BAD_REQUEST).send("Report to contact is not related to this customer!");
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send("Invalid Report to contact!");
      }
    }

    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        res.status(StatusCodes.CREATED).json({ customerCategory: response });
      }
    }
  }
};

exports.patchCustomerContact = async (req, res, next) => {
  await body('email')
  .optional()
  .custom((value, { req }) => {
    if (!value || value.trim() === '') {
      return true;
    } else {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      // return validator.isEmail(value);
    }
  })
  .withMessage('Invalid email format')
  .run(req);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.errors.forEach(error => {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, error.msg));
    });
  } else {
    var _this = this;
    this.query = req.query != "undefined" ? req.query : {}; 
    this.query.customer = req.params.customerId;
    this.query._id = req.params.id;
    // let queryString  = { _id: req.params.customerId, customer: req.params.id };

    if(req.body.reportingTo) {
      if(ObjectId.isValid(req.body.reportingTo)) {
        if(req.body.reportingTo == req.params.id) {
          return res.status(StatusCodes.BAD_REQUEST).send("Contact can't able to report to it self!");
        } else {
          let reportToContact = await CustomerContact.findOne({_id: req.body.reportingTo, customer: req.params.customerId});
          if(!reportToContact || _.isEmpty(reportToContact)) {
            return res.status(StatusCodes.BAD_REQUEST).send("Report to contact is not related to this customer!");
          }
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send("Invalid Report to contact!");
      }
    }
    
    this.dbservice.getObject(CustomerContact, this.query, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else { 
        if(!(_.isEmpty(response))){
          _this.dbservice.patchObject(CustomerContact, req.params.id, getDocumentFromReq(req), callbackFunc);
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
        }else{
          res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Customer ID Mismatch!"));
        }
      }
    }  
  }
};


exports.exportContacts = async (req, res, next) => {

  const regex = new RegExp("^EXPORT_UUID$", "i");
  let EXPORT_UUID = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
  EXPORT_UUID = EXPORT_UUID && EXPORT_UUID.value.trim().toLowerCase() === 'true' ? true:false;

  let finalData = ['Name,Title,Type,Customer,Phone,Email,Sites'];

  if(EXPORT_UUID) {
    finalData = ['ID,Name,Title,Type,Customer ID,Customer,Phone,Email,Sites'];
  }

  let contacts = await CustomerContact.find({customer: req.params.customerId, isActive:true,isArchived:false})
              .populate('customer');

  const filePath = path.resolve(__dirname, "../../../../uploads/Contacts.csv");

  contacts = JSON.parse(JSON.stringify(contacts));
  for(let contact of contacts) {
    
    if(contact && contact.customer && (contact.customer.isActive==false || contact.customer.isArchived==true)) 
      continue;

    if(Array.isArray(contact.sites) && contact.sites.length>0) {
      contact.sites = await CustomerSite.find({_id:{$in:contact.sites},isActive:true,isArchived:false});
      contact.sitesName = contact.sites.map((s)=>s.name);
      contact.sitesName = contact.sitesName.join('- ')
    }

    if(EXPORT_UUID) { 
      finalDataObj = {
        id:contact._id,
        name:contact?getContactName(contact):'',
        title:contact.title?''+contact.title.replace(/"/g,"'")+'':'',
        types:contact.contactTypes?''+contact.contactTypes.join('|').replace(/"/g,"'")+'':'',
        customerID:contact.customer?contact.customer._id:'',
        customer:contact.customer?''+contact.customer.name.replace(/"/g,"'")+'':'',
        phone:contact.phone?''+contact.phone.replace(/"/g,"'")+'':'',
        email:contact.email?''+contact.email.replace(/"/g,"'")+'':'',
        sites:contact.sitesName?''+contact.sitesName.replace(/"/g,"'")+'':'',
      };  
    } else {
      finalDataObj = {
        name:contact?getContactName(contact):'',
        title:contact.title?''+contact.title.replace(/"/g,"'")+'':'',
        types:contact.contactTypes?''+contact.contactTypes.join('|').replace(/"/g,"'")+'':'',
        customer:contact.customer?''+contact.customer.name.replace(/"/g,"'")+'':'',
        phone:contact.phone?''+contact.phone.replace(/"/g,"'")+'':'',
        email:contact.email?''+contact.email.replace(/"/g,"'")+'':'',
        sites:contact.sitesName?''+contact.sitesName.replace(/"/g,"'")+'':'',
      };  
    }

    finalDataRow = Object.values(finalDataObj);

    finalDataRow = finalDataRow.join(', ');
    finalData.push(finalDataRow);

  }

  let csvDataToWrite = finalData.join('\n');

  fs.writeFile(filePath, csvDataToWrite, 'utf8', function (err) {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.');
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else{
      return res.sendFile(filePath);
    }
  });
};


function getContactName(contact) {
  let fullName = '';

  if(contact && contact.firstName)
    fullName+= contact.firstName.replace(/"/g,"'");

  if(contact && contact.lastName)
    fullName+= contact.lastName.replace(/"/g,"'");

  return fullName+'';
}

function getDocumentFromReq(req, reqType){
  const { firstName, lastName, title, contactTypes, phone, email, sites,  address, reportingTo, department, 
    isActive, isArchived, loginUser } = req.body;
  
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
  if ("address" in req.body){
    doc.address = address;
  }

  if ("department" in req.body){
    doc.department = department;
  }

  if ("reportingTo" in req.body){
    doc.reportingTo = reportingTo;
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