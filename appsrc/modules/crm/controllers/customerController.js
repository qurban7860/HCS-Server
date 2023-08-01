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
const { Region } = require('../../regions/models');
const { Country } = require('../../config/models');
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

      if(Array.isArray(customer.verifications) && customer.verifications.length>0 ) {
        let customerVerifications = [];

        for(let verification of customer.verifications) {


          let user = await SecurityUser.findOne({ _id: verification.verifiedBy, isActive: true, isArchived: false }).select('name');

          if(user) {
            verification.verifiedBy = user;
            customerVerifications.push(verification);
          }

        }
        customer.verifications = customerVerifications;
      }
      
      res.json(customer);
    }
  } 
};

exports.getCustomers = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {}; 
  this.orderBy = { name: 1 };  
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }

  if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);

  if(!this.query.unfiltered && this.query.type !== 'SP'){
    let user = await SecurityUser.findById(req.body.loginUser.userId).select('regions customers machines').lean();
    if(user) {
      let finalQuery = {
        $or: []
      };
      if(Array.isArray(user.regions) && user.regions.length>0 ) {
        let regions = await Region.find({_id:{$in:user.regions}}).select('countries').lean();
        let countries = [];
        let countryNames = [];
        let customerSites = [];

        for(let region of regions) {
          if(Array.isArray(region.countries) && region.countries.length>0)
            countries = [...region.countries];      
        }
        
        if(Array.isArray(countries) && countries.length>0) {
          let countriesDB = await Country.find({_id:{$in:countries}}).select('country_name').lean();
          
          if(Array.isArray(countriesDB) && countriesDB.length>0)
            countryNames = countriesDB.map((c)=>c.country_name);
        }
        
        if(Array.isArray(countryNames) && countryNames.length>0) {
          customerSitesDB = await CustomerSite.find({"address.country":{$in:countryNames}}).select('_id').lean();
          
          if(Array.isArray(customerSitesDB) && customerSitesDB.length>0) 
            customerSites = customerSitesDB.map((site)=>site._id);
        
        }

        let mainSiteQuery = {$in:customerSites};
        finalQuery.$or.push({ mainSite: mainSiteQuery});
      }

      if(Array.isArray(user.customers) && user.customers.length>0) {
        let idQuery = {$in:user.customers}
        finalQuery.$or.push({ _id: idQuery});
      }

      if(finalQuery.$or.length > 0){
        this.query = {
          ...this.query,
          ...finalQuery
        }
      }
    }
  }else{
    delete this.query.unfiltered;
  }

  this.dbservice.getObjectList(Customer, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      // console.log('respomse-------------------->', response);
      res.json(response);
    }
  }
};

exports.getCustomersAgainstCountries = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {}; 
  let targetCountries = [];

  if(this.query.countries) {
    targetCountries = JSON.parse(this.query.countries);
  }
  const aggregate = [
    {
      $match: {
        mainSite: { $exists: true },
        isActive: true,
        isArchived: false,
        type: 'SP'
      }
    },
    {
      $lookup: {
        from: "CustomerSites",
        localField: "mainSite",
        foreignField: "_id",
        as: "mainSiteData"
      }
    },
    {
      $match: {
        "mainSiteData.address.country": { $in: targetCountries }
      }
    }
  ];
  const params = {};

  this.dbservice.getObjectListWithAggregate(Customer, aggregate, params, callbackFunc);
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
    if(customer.type != 'SP'){
      this.dbservice.deleteObject(Customer, req.params.id, res, callbackFunc);
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
      reqMainSite.body.loginUser = req.body.loginUser;
      doc.mainSite = customerSiteController.getDocumentFromReq(reqMainSite, 'new');
      doc.mainSite.customer = doc._id;
    }

    if(technicalContact != undefined && typeof technicalContact !== "string") {
      var reqprimaryTechnicalContact = {};
      reqprimaryTechnicalContact.body = technicalContact;
      reqprimaryTechnicalContact.body.loginUser = req.body.loginUser;
      doc.technicalContact = customerContactController.getDocumentFromReq(reqprimaryTechnicalContact, 'new');
      doc.technicalContact.customer = doc._id;
    }

    if(billingContact != undefined && typeof billingContact !== "string") {
      var reqPrimarybillingContact = {};
      reqPrimarybillingContact.body = billingContact;
      reqPrimarybillingContact.body.loginUser = req.body.loginUser;
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


async function getToken(req){
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:'';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}