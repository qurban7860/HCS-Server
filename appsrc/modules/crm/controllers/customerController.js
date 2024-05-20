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
const applyUserFilter = require('../utils/userFilters');
const { Product, ProductStatus } = require('../../products/models');
const { SecurityUser } = require('../../security/models');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { Config } = require('../../config/models');

const customerSiteController = require('./customerSiteController');
const customerContactController = require('./customerContactController');



this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'mainSite', select: 'address name phoneNumbers email fax primaryBillingContact primaryTechnicalContact website' },
  { path: 'primaryBillingContact', select: 'firstName lastName' },
  { path: 'primaryTechnicalContact', select: 'firstName lastName' },
  { path: 'accountManager', select: 'firstName lastName email' },
  { path: 'projectManager', select: 'firstName lastName email' },
  { path: 'supportManager', select: 'firstName lastName email' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'mainSite.primaryBillingContact', select: 'firstName lastName' },
  { path: 'mainSite.primaryTechnicalContact', select: 'firstName lastName' },
];


this.populateList = [
  { path: 'mainSite', select: 'address name phoneNumbers email' },
  { path: 'accountManager', select: 'firstName lastName phoneNumbers' },
  { path: 'supportManager', select: 'firstName lastName phoneNumbers' },
  { path: 'projectManager', select: 'firstName lastName phoneNumbers' }
];


exports.getCustomer = async (req, res, next) => {
  let validFlag = 'basic';

  if (req.params.flag && req.params.flag == 'extended') {
    validFlag = req.params.flag;
  }
  this.query = req.query != "undefined" ? req.query : {};
  this.customerId = req.params.customerId;
  this.query.customer = this.customerId;

  let populatedSites;
  let populatedContacts;
  let populatedNotes;
  let populatedVerfications;


  const queryString = await applyUserFilter(req);
  if (queryString) {
    const query_ = { ...queryString, _id: req.params.id };
    const cusObj = await Customer.findOne(query_).select('_id').lean();

    if (!cusObj) {
      return res.status(StatusCodes.BAD_REQUEST).send("Access denied for the customer is not permitted by the administrator.");
    }
  }
  this.dbservice.getObjectById(Customer, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {


      const customer = JSON.parse(JSON.stringify(response));
      if (customer?.mainSite?.primaryBillingContact && ObjectId.isValid(customer?.mainSite?.primaryBillingContact)) {
        customerContact_ = await CustomerContact.findOne({ _id: customer.mainSite.primaryBillingContact }).select('firstName lastName');
        customer.mainSite.primaryBillingContact = customerContact_;
      }
      if (customer?.mainSite?.primaryTechnicalContact && ObjectId.isValid(customer?.mainSite?.primaryTechnicalContact)) {
        customerContact_ = await CustomerContact.findOne({ _id: customer.mainSite.primaryTechnicalContact }).select('firstName lastName');
        customer.mainSite.primaryTechnicalContact = customerContact_;
      }

      if (validFlag == 'extended') {
        if (!(_.isEmpty(customer))) {
          if (customer.sites.length > 0) {
            populatedSites = await CustomerSite.find({ _id: { $in: customer.sites } });
            customer.sites = [];
            customer.sites = populatedSites;
          }

          if (customer.contacts.length > 0) {
            populatedContacts = await CustomerContact.find({ _id: { $in: customer.contacts } });
            customer.contacts = [];
            customer.contacts = populatedContacts;
          }

          populatedNotes = await CustomerNote.find({ customer: customer._id, isActive: true, isArchived: false });
          if (populatedNotes.length > 0) {
            customer.notes = populatedNotes;
          }

        }
      }

      if (Array.isArray(customer.verifications) && customer.verifications.length > 0) {
        let customerVerifications = [];

        for (let verification of customer.verifications) {


          let user = await SecurityUser.findOne({ _id: verification.verifiedBy, isActive: true, isArchived: false }).select('name');

          if (user) {
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
  if (this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }

  if (!req.body.loginUser)
    req.body.loginUser = await getToken(req);

  const finalQuery = await applyUserFilter(req);
  if (finalQuery) {
    this.query = {
      ...this.query,
      ...finalQuery
    }
  }

  delete req.query.unfiltered;

  //TODO: to remove this in feature.
  req.body.pageSize = 2000;
  this.dbservice.getObjectList(req, Customer, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getCustomersAgainstCountries = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  let targetCountries = [];

  if (this.query.countries) {
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
  if (!_.isEmpty(customer)) {
    if (customer.type != 'SP') {
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
  let CustomerObj;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if(req.body.ref?.trim().length > 0) {
      let refCode = "^" + req.body.ref.trim() + "$";
      let queryRef = {
        ref: {
          $regex: refCode,
          $options: 'i'
        }
      };
      const refFound = await Customer.findOne(queryRef).lean().select('_id');
      console.log({refFound});
      if(refFound) {
        return res.status(StatusCodes.BAD_REQUEST).send(`The reference already exists within the system, indicating duplication constraints.`);
      }
    }

    if (req.body.clientCode && typeof req.body.clientCode != "undefined" && req.body.clientCode.length > 0) {
      let clientCode = "^" + req.body.clientCode.trim() + "$";
      let queryCustomer = {
        clientCode: {
          $regex: clientCode,
          $options: 'i'
        }
      };
      CustomerObj = await Customer.findOne(queryCustomer);
    }
    //, _id: { $ne: ObjectId("651e8e1870e874147c999191") }    

    if (CustomerObj) {
      res.status(StatusCodes.CONFLICT).send("Customer already exists with same client code!");
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
  }
};

exports.patchCustomer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let CustomerObj;
    if (req.body.clientCode && typeof req.body.clientCode != "undefined" && req.body.clientCode.length > 0) {
      let clientCode = "^" + req.body.clientCode.trim() + "$";
      let queryCustomer = {
        clientCode: {
          $regex: clientCode,
          $options: 'i'
        }, _id: { $ne: req.params.id }
      };
      CustomerObj = await Customer.findOne(queryCustomer);
    }

    if(req.body.ref?.trim().length > 0) {
      let refCode = "^" + req.body.ref.trim() + "$";
      let queryRef = {
        ref: {
          $regex: refCode,
          $options: 'i'
        }, _id: { $ne: req.params.id }
      };
      const refFound = await Customer.findOne(queryRef).lean().select('_id');
      if(refFound) {
        return res.status(StatusCodes.BAD_REQUEST).send(`The reference already exists within the system, indicating duplication constraints.`);
      }
    }

    if (!CustomerObj) {
      if (("isArchived" in req.body && req.body.isArchived === true) || ("isActive" in req.body && req.body.isActive === false)) {
        let customer = await Customer.findById(req.params.id);
        if (customer.type === 'SP') {
          const message = req.body.isArchived ? 'SP Customer cannot be deleted!' : 'SP Customer cannot be deactivated!';
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, message, true));
        } else {
          if ("isArchived" in req.body && req.body.isArchived === true) {
            const productListNonArchived = await Product.find({ customer: req.params.id, isArchived: false }).select('serialNo').slice();
            const serialNumbersString = productListNonArchived.map(product => product.serialNo).join(', ');
            if (productListNonArchived?.length > 0) {
              return res.status(StatusCodes.BAD_REQUEST).send(`Found non-archived machines against customer. ${serialNumbersString}`);
            }
          }
        }
      }

      // ToDo correct spell mistake from front end
      if (req.body.isVerified || req.body.isVarified) {
        let customer = await Customer.findById(req.params.id);
        if (!customer) {
          return res.status(StatusCodes.BAD_REQUEST).json({ message: "Customer Not Found" });
        }

        if (!Array.isArray(customer.verifications))
          customer.verifications = [];

        for (let verif of customer.verifications) {
          if (verif.verifiedBy == req.body.loginUser.userId)
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Already verified" });
        }
        customer.verifications.push({
          verifiedBy: req.body.loginUser.userId,
          verifiedDate: new Date()
        })
        customer = await customer.save();
        return res.status(StatusCodes.ACCEPTED).json(customer);
      }

      this.dbservice.patchObject(Customer, req.params.id, getDocumentFromReq(req), callbackFunc);
      async function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
        } else {
          await updateArchivedStatus(req);
          if (req.body.updateProductManagers && (req.body.updateProductManagers == 'true' || req.body.updateProductManagers == true)) {
            let updateOperation = {};
            if (req.body.accountManager)
              updateOperation.accountManager = req.body.accountManager;
            if (req.body.projectManager)
              updateOperation.projectManager = req.body.projectManager;
            if (req.body.supportManager)
              updateOperation.supportManager = req.body.supportManager;
            if (Object.keys(updateOperation).length !== 0 && req.params.id) {
              ProductStatus.find({ slug: 'transphered' }).select('id').exec((err, documents) => {
                if (err) {
                  console.error('Error finding documents:', err);
                } else {
                  let queryForProductUpdate = { customer: req.params.id, isActive: true, isArchived: false, status: { $nin: documents } };
                  Product.updateMany(queryForProductUpdate, updateOperation, (err, result) => {
                    if (err) {
                      console.error('Error updating documents:', err);
                    } else {
                      console.log(`${result.nModified} documents updated`);
                    }
                  });
                }
              });
            }
          }
          res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
        }
      }
    } else {
      res.status(StatusCodes.CONFLICT).send("Customer already exists with same client code!");
    }
  }
};

async function updateArchivedStatus(req) {
  const customerId = req.params.id;
  if ("isArchived" in req.body) {
    const isArchived = req.body.isArchived;
    const whereClause = { customer: customerId, isArchived: !isArchived };
    const setClause = { isArchived: isArchived, archivedByCustomer: isArchived };
    if(!isArchived) {
      whereClause.archivedByCustomer = true;
    }
    await CustomerSite.updateMany(whereClause, setClause);
    await CustomerContact.updateMany(whereClause, setClause);
    await CustomerNote.updateMany(whereClause, setClause);
  }
}


exports.exportCustomersJSONForCSV = async (req, res, next) => {
  try {
    let listObjects = [];
    const regex = new RegExp("^EXPORT_UUID$", "i");
    let EXPORT_UUID = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    EXPORT_UUID = EXPORT_UUID && EXPORT_UUID.value.trim().toLowerCase() === 'true' ? true : false;

    let query__ = { isArchived: false };
    let listCustomers = await Customer.find({ "excludeReports": { $ne: true } }).select('_id').lean();
    if (listCustomers && listCustomers.length > 0)
      query__._id = { $in: listCustomers };

    let customers = await Customer.find(query__)
      .populate('mainSite')
      .populate('primaryBillingContact')
      .populate('primaryTechnicalContact')
      .populate('accountManager')
      .populate('projectManager')
      .populate('supportManager');

    customers = JSON.parse(JSON.stringify(customers));

    const customerPromises = customers.map(async (customer) => {

      // if(Array.isArray(customer.sites) && customer.sites.length>0) {
      //   customer.sites = await CustomerSite.find({_id:{$in:customer.sites},isActive:true,isArchived:false});
      //   customer.sitesName = customer.sites.map((s)=>s.name);
      //   customer.sitesName = customer.sitesName.join('|')
      // }

      // if(Array.isArray(customer.contacts) && customer.contacts.length>0) {
      //   customer.contacts = await CustomerContact.find({_id:{$in:customer.contacts},isActive:true,isArchived:false});
      //   customer.contactsName = customer.contacts.map((c)=>`${c.firstName} ${c.lastName}`);
      //   customer.contactsName = customer.contactsName.join('|')
      // }

      customer.sites = await CustomerSite.find({ customer: customer._id, isActive: true, isArchived: false });
      if (Array.isArray(customer.sites) && customer.sites.length > 0) {
        customer.sitesName = customer.sites.map((s) => s.name);
        customer.sitesName = customer.sitesName.join('|')
      } else { customer.sitesName = ""; }
      customer.contacts = await CustomerContact.find({ customer: customer._id, isActive: true, isArchived: false });
      if (Array.isArray(customer.contacts) && customer.contacts.length > 0) {
        customer.contactsName = customer.contacts.map((c) => `${c.firstName} ${c.lastName}`);
        customer.contactsName = customer.contactsName.join('|')
      } else { customer.contactsName = ""; }


      if (EXPORT_UUID) {
        finalDataObj = {
          "ID": customer._id,
          "Name": customer.name ? '' + customer.name.replace(/"/g, "'") + '' : '',
          "Code": customer.clientCode ? '' + customer.clientCode.replace(/"/g, "'") + '' : '',
          "TradingName": customer.tradingName ? '' + customer.tradingName.join('-').replace(/"/g, "'") + '' : '',
          "Type": '' + customer.type + '',
          "MainSite": customer.mainSite ? '' + customer.mainSite.name.replace(/"/g, "'") + '' : '',
          "MainSiteID": customer.mainSite ? customer.mainSite._id : '',
          "MainSiteCountry": customer.mainSite && customer?.mainSite?.address?.country ? '' + customer?.mainSite?.address?.country?.replace(/"/g, "'") + '' : '',
          "Sites": customer.sitesName ? '' + customer.sitesName.replace(/"/g, "'") + '' : '', //
          "Contacts": customer.contactsName ? '' + customer.contactsName.replace(/"/g, "'") + '' : '', //
          "BillingContact": customer.primaryBillingContact ? getContactName(customer.primaryBillingContact) : '',
          "BillingContactID": customer.primaryBillingContact ? customer.primaryBillingContact._id : '',
          "TechnicalContact": customer.primaryTechnicalContact ? getContactName(customer.primaryTechnicalContact) : '',
          "TechnicalContactID": customer.primaryTechnicalContact ? customer.primaryTechnicalContact._id : '',
          "AccountManager": customer.accountManager ? getContactName(customer.accountManager) : '',
          "AccountManagerID": customer.accountManager ? getGUIDs(customer.accountManager) : '',
          "ProjectManager": customer.projectManager ? getContactName(customer.projectManager) : '',
          "ProjectManagerID": customer.projectManager ? getGUIDs(customer.projectManager) : '',
          "SupportSubscription": customer.supportSubscription ? 'Yes' : 'No',
          "SupportManager": customer.supportManager ? getContactName(customer.supportManager) : '',
          "SupportManagerID": customer.supportManager ? getGUIDs(customer.supportManager) : ''
        }
      } else {
        finalDataObj = {
          "Name": customer.name ? '' + customer.name.replace(/"/g, "'") + '' : '',
          "Code": customer.clientCode ? '' + customer.clientCode.replace(/"/g, "'") + '' : '',
          "TradingName": customer.tradingName ? '' + customer.tradingName.join('-').replace(/"/g, "'") + '' : '',
          "Type": '' + customer.type + '',
          "MainSite": customer.mainSite ? '' + customer.mainSite.name.replace(/"/g, "'") + '' : '',
          "MainSiteCountry": customer.mainSite ? '' + customer?.mainSite?.address?.country.replace(/"/g, "'") + '' : '',
          "Sites": customer.sitesName ? '' + customer.sitesName.replace(/"/g, "'") + '' : '',
          "Contacts": customer.contactsName ? '' + customer.contactsName.replace(/"/g, "'") + '' : '',
          "BillingContact": customer.primaryBillingContact ? getContactName(customer.primaryBillingContact) : '',
          "TechnicalContact": customer.primaryTechnicalContact ? getContactName(customer.primaryTechnicalContact) : '',
          "AccountManager": customer.accountManager ? getContactName(customer.accountManager) : '',
          "ProjectManager": customer.projectManager ? getContactName(customer.projectManager) : '',
          "SupportSubscription": customer.supportSubscription ? 'Yes' : 'No',
          "SupportManager": customer.supportManager ? getContactName(customer.supportManager) : '',
        }
      }

      listObjects.push(finalDataObj);
    });

    await Promise.all(customerPromises);
    return res.json(listObjects);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
}

function getContactName(contacts) {
  if (Array.isArray(contacts)) {
    const names = contacts.map(contact => {
      let fullName = '';

      if (contact && contact.firstName) {
        fullName += contact.firstName.replace(/"/g, "'");
      }

      if (contact && contact.lastName) {
        fullName += ' ' + contact.lastName.replace(/"/g, "'");
      }

      return fullName.trim();
    });

    return names.join(' | ');
  } else if (contacts && (contacts.firstName || contacts.lastName)) {
    let fullName = '';

    if (contacts.firstName) {
      fullName += contacts.firstName.replace(/"/g, "'");
    }

    if (contacts.lastName) {
      fullName += ' ' + contacts.lastName.replace(/"/g, "'");
    }

    return fullName.trim();
  } else {
    return '';
  }
}

function getGUIDs(inputData) {
  if (Array.isArray(inputData)) {
    const extractedIds = inputData.map(item => {
      let idString = '';
      if (item && item._id) {
        idString += item._id;
      }

      return idString;
    });
    return extractedIds.join(' | ');
  } else if (inputData && inputData._id) {
    let singleIdString = '';

    if (inputData._id) {
      singleIdString += inputData._id.replace(/"/g, "'");
    }

    return singleIdString.trim();
  } else {
    return '';
  }
}

function getDocumentFromReq(req, reqType) {
  const { name, clientCode, ref, tradingName, groupCustomer, type, mainSite, sites, contacts, website,
    billingContact, primaryBillingContact, technicalContact, primaryTechnicalContact, isTechnicalContactSameAsBillingContact,
    accountManager, projectManager, supportSubscription, supportManager, isFinancialCompany, excludeReports,
    isActive, isArchived, loginUser } = req.body;
  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Customer({});
    doc.type = "customer";
  } else {
    if ("type" in req.body) {
      doc.type = type;
    }
  }

  if ("name" in req.body) {
    doc.name = name;
  }

  if ("isTechnicalContactSameAsBillingContact" in req.body) {
    doc.isTechnicalContactSameAsBillingContact = isTechnicalContactSameAsBillingContact;
  }

  if ("clientCode" in req.body) {
    doc.clientCode = clientCode.trim();
  }

  if ("ref" in req.body) {
    doc.ref = ref.trim();
  }

  if ("tradingName" in req.body) {
    doc.tradingName = tradingName;
  }

  if ("groupCustomer" in req.body) {
    doc.groupCustomer = groupCustomer;
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

  if (reqType && reqType == "new") {
    if (mainSite != undefined && typeof mainSite !== "string") {
      var reqMainSite = {};
      reqMainSite.body = mainSite;
      reqMainSite.body.loginUser = req.body.loginUser;

      doc.mainSite = customerSiteController.getDocumentFromReq(reqMainSite, 'new');
      doc.mainSite.customer = doc._id;
    }

    if(!isTechnicalContactSameAsBillingContact) {
      if (technicalContact != undefined && typeof technicalContact !== "string") {
        var reqprimaryTechnicalContact = {};
        reqprimaryTechnicalContact.body = technicalContact;
        reqprimaryTechnicalContact.body.loginUser = req.body.loginUser;
        doc.technicalContact = customerContactController.getDocumentFromReq(reqprimaryTechnicalContact, 'new');
        doc.technicalContact.customer = doc._id;
      }
    }

    if (billingContact != undefined && typeof billingContact !== "string") {
      var reqPrimarybillingContact = {};
      reqPrimarybillingContact.body = billingContact;
      reqPrimarybillingContact.body.loginUser = req.body.loginUser;
      doc.billingContact = customerContactController.getDocumentFromReq(reqPrimarybillingContact, 'new');
      doc.billingContact.customer = doc._id;
    }


  } else {
    if ("mainSite" in req.body) {
      doc.mainSite = mainSite;
    }

    if ("primaryBillingContact" in req.body) {
      doc.primaryBillingContact = primaryBillingContact;
    }

    if ("primaryTechnicalContact" in req.body) {
      doc.primaryTechnicalContact = primaryTechnicalContact;
    }
  }

  if ("sites" in req.body) {
    doc.sites = sites;
  }

  if ("contacts" in req.body) {
    doc.contacts = contacts;
  }

  if ("website" in req.body) {
    doc.website = website;
  }

  if ("accountManager" in req.body) {
    doc.accountManager = accountManager;
  }

  if ("projectManager" in req.body) {
    doc.projectManager = projectManager;
  }

  if ("supportSubscription" in req.body) {
    doc.supportSubscription = supportSubscription;
  }

  if ("supportManager" in req.body) {
    doc.supportManager = supportManager;
  }

  if ("isFinancialCompany" in req.body) {
    doc.isFinancialCompany = isFinancialCompany;
  }

  if ("excludeReports" in req.body) {
    doc.excludeReports = excludeReports;
  }


  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }




  if (reqType == "new" && "loginUser" in req.body) {
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


async function getToken(req) {
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}