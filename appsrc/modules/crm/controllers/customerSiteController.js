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

const { CustomerSite, CustomerContact, Customer, CustomerNote } = require('../models');
const { ProductServiceRecords } = require('../../products/models');
const { Visit } = require('../../calenders/models');

const { Document } = require('../../documents/models');

const applyUserFilter  = require('../utils/userFilters');

const { Config, Country } = require('../../config/models');
const { Product } = require('../../products/models');
const { SecurityUser } = require('../../security/models');
const { Region } = require('../../regions/models');
var ObjectId = require('mongoose').Types.ObjectId;



const fs = require('fs');
const path = require('path');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'customer', select: 'name'},
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

    const finalQuery = await applyUserFilter(req);
    if(finalQuery) {
      const allowedCustomers = await Customer.find(finalQuery).select('_id').lean();
      if(allowedCustomers?.length > 0) {
        this.query.customer = { $in: allowedCustomers };
      }
    }

    this.customerId = req.params.customerId;
    let customerObj;
    if(this.customerId && ObjectId.isValid(this.customerId)) {
      this.query.customer = this.customerId;
      customerObj = await Customer.findOne({_id: this.customerId}).lean().select('mainSite');
    }
    
    this.dbservice.getObjectList(req, CustomerSite, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(json(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)));
      } else {
        if(customerObj?.mainSite) {
          let index = response.findIndex(item => item._id+"" === customerObj.mainSite+"");
          if (index !== -1) {
            let item = response.splice(index, 1)[0]; // Remove the item from the response
            response.unshift(item); // Add the item to the beginning of the response
          }
        }
        res.json(response);
      }
    }
};

exports.searchCustomerSites = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};   
  this.dbservice.getObjectList(req, CustomerSite, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
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
    if(req.body.phoneNumbers && Array.isArray(req.body.phoneNumbers)) {
      const validPhoneNumbers = req.body.phoneNumbers.filter(phoneNumber => phoneNumber?.contactNumber && phoneNumber?.contactNumber.trim() !== '' && phoneNumber?.contactNumber.length > 0);
      req.body.phoneNumbers = validPhoneNumbers;
    }
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        updateContactAddress(req.body.updateAddressPrimaryTechnicalContact, req.body.primaryTechnicalContact, req.body.address);
        updateContactAddress(req.body.updateAddressPrimaryBillingContact, req.body.primaryBillingContact, req.body.address);      
        res.status(StatusCodes.CREATED).json({ CustomerSite: response });
      }
    }
  }
};

async function updateContactAddress(updateAddressPrimaryTechnicalContact, primaryTechnicalContact, address) {
  if (
    primaryTechnicalContact &&
    ObjectId.isValid(primaryTechnicalContact) &&
    address &&
    updateAddressPrimaryTechnicalContact &&
    (updateAddressPrimaryTechnicalContact === true ||
      updateAddressPrimaryTechnicalContact === 'true')
  ) {
    try { 
      const setQuery = {$set: { address: address }};
      await CustomerContact.updateOne(
        { _id: primaryTechnicalContact },
        setQuery
      );
    } catch (error) {
      console.error('Failed to update address:', error);
    }
  }
}

exports.patchCustomerSite = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if(req.body?.isArchived == 'true' || req.body?.isArchived === true ){
      const customerFound = await Customer.findOne({mainSite: req.params.id, isActive: true, isArchived: false}).select('_id').lean();
      if(customerFound) {
        res.status(StatusCodes.BAD_REQUEST).send("Site is attached with Customers"); 
      }

      const noteFound = await CustomerNote.findOne({site: req.params.id, isActive: true, isArchived: false}).select('_id').lean();
      console.log({noteFound});
      if(noteFound) {
        return res.status(StatusCodes.BAD_REQUEST).send("Site is attached with Notes"); 
      }

      const documentSite = await Document.findOne({site: req.params.id, isActive: true, isArchived: false}).select('_id').lean();
      if(documentSite) {
        return res.status(StatusCodes.BAD_REQUEST).send("Site is attached with Documents"); 
      }

      const productSite = await Product.findOne({site: req.params.id, isActive: true, isArchived: false}).select('_id').lean();
      if(productSite) {
        return res.status(StatusCodes.BAD_REQUEST).send("Site is attached with Product"); 
      }

      const productServiceRecord = await ProductServiceRecords.findOne({site: req.params.id, isActive: true, isArchived: false}).select('_id').lean();
      if(productServiceRecord) {
        return res.status(StatusCodes.BAD_REQUEST).send("Site is attached with Product Service Record"); 
      }

      const visitRecord = await Visit.findOne({site: req.params.id, isActive: true, isArchived: false}).select('_id').lean();
      if(visitRecord) {
        return res.status(StatusCodes.BAD_REQUEST).send("Site is attached with Product Service Record"); 
      }
    }
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
                      updateContactAddress(req.body.updateAddressPrimaryTechnicalContact, req.body.primaryTechnicalContact, req.body.address);
                      updateContactAddress(req.body.updateAddressPrimaryBillingContact, req.body.primaryBillingContact, req.body.address);   
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
      if(req.body.phoneNumbers && Array.isArray(req.body.phoneNumbers)) {
        const validPhoneNumbers = req.body.phoneNumbers.filter(phoneNumber => phoneNumber?.contactNumber && phoneNumber?.contactNumber.trim() !== '' && phoneNumber?.contactNumber.length > 0);
        req.body.phoneNumbers = validPhoneNumbers;
      }
      
      this.dbservice.patchObject(CustomerSite, req.params.id, getDocumentFromReq(req), callbackFunc);
      function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
            );
        } else {
          updateContactAddress(req.body.updateAddressPrimaryTechnicalContact, req.body.primaryTechnicalContact, req.body.address);
          updateContactAddress(req.body.updateAddressPrimaryBillingContact, req.body.primaryBillingContact, req.body.address);   
          res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
        }
      }
    }
  }
};

exports.exportSitesJSONForCSV = async (req, res, next) => {
  try {
    const regex = new RegExp("^EXPORT_UUID$", "i");
    let EXPORT_UUID = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    EXPORT_UUID = EXPORT_UUID && EXPORT_UUID.value.trim().toLowerCase() === 'true' ? true : false;

    let queryString_ = { isArchived: false };
    // const fetchAllSites = req.query.fetchAllSites === true || req.query.fetchAllSites === 'true' ? true : false;
    if(ObjectId.isValid(req?.params?.customerId)) {
      queryString_.customer = req.params.customerId;
    } else {
      let listCustomers = await Customer.find({"excludeReports": { $ne: true }, isArchived: false}).select('_id').lean();
      if(listCustomers && listCustomers.length > 0)
        queryString_.customer = { $in: listCustomers };
    }

    const collationOptions = {
      locale: 'en',
      strength: 2
    };


    const finalQuery = await applyUserFilter(req);
    if(finalQuery) {
      const allowedCustomers = await Customer.find(finalQuery).select('_id').lean();
      if(allowedCustomers?.length > 0) {
        queryString_.customer = { $in: allowedCustomers };
      }
    }

    let sites = await CustomerSite.find(queryString_).collation(collationOptions).sort({name: 1})
      .populate('customer')
      .populate('primaryBillingContact')
      .populate('primaryTechnicalContact');

    sites = JSON.parse(JSON.stringify(sites));
    let listJSON = [];

    const options = { timeZone: 'Pacific/Auckland', year: 'numeric', month: 'numeric', day: 'numeric' };
    await Promise.all(sites.map(async (site) => {
      if (site && site.customer && (site.customer.isActive == false || site.customer.isArchived == true))
        return;

      if (Array.isArray(site.contacts) && site.contacts.length > 0) {
        site.contacts = await CustomerContact.find({ _id: { $in: site.contacts }, isActive: true, isArchived: false });
        site.contactsName = site.contacts.map((c) => `${c.firstName} ${c.lastName}`);
        site.contactsName = '"' + site.contactsName + '"';
      }

      let finalDataObj;
      let createdDateLTZ = ""; 
      if(site.createdAt && site.createdAt.length > 0) { const createdDate = new Date(site.createdAt); createdDateLTZ = createdDate.toLocaleString('en-NZ', options); }

      let updatedDateLTZ = ""; 
      if(site.updatedAt && site.updatedAt.length > 0) { const updatedAt = new Date(site.updatedAt); updatedDateLTZ = updatedAt.toLocaleString('en-NZ', options); }    
      
      const phoneNumber_ = formatPhoneNumber(site);

      if (EXPORT_UUID) {
        finalDataObj = {
          SiteID: site._id ? site._id : '',
          SiteName: site ? '' + site.name.replace(/"/g, "'") + '' : '',
          CustomerID: site.customer ? site.customer._id : '',
          CustomerName: site.customer ? '' + site.customer.name.replace(/"/g, "'") + '' : '',
          Street: site.address ? (site.address.street ? '' + site.address.street.replace(/"/g, "'") + '' : '') : '',
          Suburb: site.address ? (site.address.suburb ? '' + site.address.suburb.replace(/"/g, "'") + '' : '') : '',
          City: site.address ? (site.address.city ? '' + site.address.city.replace(/"/g, "'") + '' : '') : '',
          Region: site.address ? (site.address.region ? '' + site.address.region.replace(/"/g, "'") + '' : '') : '',
          PostCode: site.address ? (site.address.postcode ? '' + site.address.postcode.replace(/"/g, "'") + '' : '') : '',
          Country: site.address ? (site.address.country ? '' + site.address.country.replace(/"/g, "'") + '' : '') : '',
          Latitude: site.lat ? '' + site.lat.replace(/"/g, "'") + '' : '',
          Longitude: site.long ? '' + site.long.replace(/"/g, "'") + '' : '',
          BillingContactID: site.primaryBillingContact ? site.primaryBillingContact._id : '',
          BillingContact: site.primaryBillingContact ? getContactName(site.primaryBillingContact) : '',
          TechnicalContactID: site.primaryTechnicalContact ? site.primaryTechnicalContact._id : '',
          TechnicalContacts: site.primaryTechnicalContact ? getContactName(site.primaryTechnicalContact) : '',
          Phone: phoneNumber_,
          Email: site.email ? site.email : '',
          Website: site.website ? site.website : '',
          CreationDate : createdDateLTZ,
          ModificationDate : updatedDateLTZ,
          Active : site.isActive ? 'true' : 'false',
          Archived : site.isArchived ? 'true' : 'false'
        };
      } else {
        finalDataObj = {
          SiteName: site ? '' + site.name.replace(/"/g, "'") + '' : '',
          CustomerName: site.customer ? '' + site.customer.name.replace(/"/g, "'") + '' : '',
          Street: site.address ? (site.address.street ? '' + site.address.street.replace(/"/g, "'") + '' : '') : '',
          Suburb: site.address ? (site.address.suburb ? '' + site.address.suburb.replace(/"/g, "'") + '' : '') : '',
          City: site.address ? (site.address.city ? '' + site.address.city.replace(/"/g, "'") + '' : '') : '',
          Region: site.address ? (site.address.region ? '' + site.address.region.replace(/"/g, "'") + '' : '') : '',
          PostCode: site.address ? (site.address.postcode ? '' + site.address.postcode.replace(/"/g, "'") + '' : '') : '',
          Country: site.address ? (site.address.country ? '' + site.address.country.replace(/"/g, "'") + '' : '') : '',
          Latitude: site.lat ? '' + site.lat.replace(/"/g, "'") + '' : '',
          Longitude: site.long ? '' + site.long.replace(/"/g, "'") + '' : '',
          BillingContact: site.primaryBillingContact ? getContactName(site.primaryBillingContact) : '',
          TechnicalContacts: site.primaryTechnicalContact ? getContactName(site.primaryTechnicalContact) : '',
          Phone: phoneNumber_,
          Email: site.email ? site.email : '',
          Website: site.website ? site.website : '',
          CreationDate : createdDateLTZ,
          ModificationDate : updatedDateLTZ,
          Active : site.isActive ? 'true' : 'false',
          Archived : site.isArchived ? 'true' : 'false'
        };
      }

      listJSON.push(finalDataObj);
    }));

    res.send(listJSON);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
}

function formatPhoneNumber(site, type = "PHONE") {
  let phoneNumber_ = "";
  const phoneNo = site?.phoneNumbers?.find(item => item.type === type);
  if (phoneNo) {
      const countryCode = phoneNo.countryCode ? (phoneNo.countryCode.startsWith('+') ? phoneNo.countryCode : `+${phoneNo.countryCode}`) : "";
      const number = phoneNo.contactNumber ? ` ${phoneNo.contactNumber}` : "";
      phoneNumber_ = countryCode + number;
  }
  return phoneNumber_;
}

function getContactName(contact) {
  let fullName = '"';

  if(contact && contact.firstName)
    fullName+= contact.firstName.replace(/"/g,"'");

  if(contact && contact.lastName)
    fullName+= contact.lastName.replace(/"/g,"'");

  return fullName+'"';
}

function getDocumentFromReq(req, reqType){
  const { name, phone, email, phoneNumbers, fax, website, address, lat, long, 
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
  if ("phoneNumbers" in req.body){
    doc.phoneNumbers = phoneNumbers;
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