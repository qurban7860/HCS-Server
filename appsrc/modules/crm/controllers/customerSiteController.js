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

const { CustomerSite, CustomerContact, Customer } = require('../models');
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
    this.dbservice.getObjectList(req, CustomerSite, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
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
  console.log("-->", updateAddressPrimaryTechnicalContact, primaryTechnicalContact, address);
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

// exports.exportSites = async (req, res, next) => {
//   const regex = new RegExp("^EXPORT_UUID$", "i");
//   let EXPORT_UUID = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
//   EXPORT_UUID = EXPORT_UUID && EXPORT_UUID.value.trim().toLowerCase() === 'true' ? true:false;
  
//   let finalData = ['Name,Customer,Street,Suburb,City,Region,PostCode,Country,Latitude,Longitude,Contacts,Billing Contact,Technical Contact'];

//   if(EXPORT_UUID) {
//     finalData = ['Name,CustomerID,Customer,Street,Suburb,City,Region,PostCode,Country,Latitude,Longitude,Contacts,Billing Contact,Billing Contact ID,Technical Contact,Technical Contact ID'];
//   }

//   let sites = await CustomerSite.find({customer: req.params.customerId, isActive:true,isArchived:false})
//               .populate('customer')
//               .populate('primaryBillingContact')
//               .populate('primaryTechnicalContact');

//   const filePath = path.resolve(__dirname, "../../../../uploads/Sites.csv");


//   sites = JSON.parse(JSON.stringify(sites));
//   for(let site of sites) {
//     if(site && site.customer && (site.customer.isActive==false || site.customer.isArchived==true)) 
//       continue;
    
//     if(Array.isArray(site.contacts) && site.contacts.length>0) {
//       site.contacts = await CustomerContact.find({_id:{$in:site.contacts},isActive:true,isArchived:false});
//       site.contactsName = site.contacts.map((c)=>`${c.firstName} ${c.lastName}`);
//       site.contactsName = '"'+site.contactsName+'"'
//     }

//     if(EXPORT_UUID) { 
//       finalDataObj = {
//         name:site?''+site.name.replace(/"/g,"'")+'':'',
//         customerId:site.customer?site.customer._id:'',
//         customer:site.customer?''+site.customer.name.replace(/"/g,"'")+'':'',
//         street:site.address?site.address.street?''+site.address.street.replace(/"/g,"'")+'':'':'',
//         suburb:site.address?site.address.suburb?''+site.address.suburb.replace(/"/g,"'")+'':'':'',
//         city:site.address?site.address.city?''+site.address.city.replace(/"/g,"'")+'':'':'',
//         region:site.address?site.address.region?''+site.address.region.replace(/"/g,"'")+'':'':'',
//         postCode:site.address?site.address.postcode?''+site.address.postcode.replace(/"/g,"'")+'':'':'',
//         country:site.address?site.address.country?''+site.address.country.replace(/"/g,"'")+'':'':'',
//         lat:site.lat?''+site.lat.replace(/"/g,"'")+'':'',
//         long:site.long?''+site.long.replace(/"/g,"'")+'':'',
//         contacts:site.contactsName?''+site.contactsName.replace(/"/g,"'")+'':'',
//         billingContact:site.primaryBillingContact?getContactName(site.primaryBillingContact):'',
//         billingContactID:site.primaryBillingContact?site.primaryBillingContact._id:'',
//         technicalContact:site.primaryTechnicalContact?getContactName(site.primaryTechnicalContact):'',
//         technicalContactID:site.primaryTechnicalContact?site.primaryTechnicalContact._id:'',
//       };
//     } else {
//       finalDataObj = {
//         name:site?''+site.name.replace(/"/g,"'")+'':'',
//         customer:site.customer?''+site.customer.name.replace(/"/g,"'")+'':'',
//         street:site.address?site.address.street?''+site.address.street.replace(/"/g,"'")+'':'':'',
//         suburb:site.address?site.address.suburb?''+site.address.suburb.replace(/"/g,"'")+'':'':'',
//         city:site.address?site.address.city?''+site.address.city.replace(/"/g,"'")+'':'':'',
//         region:site.address?site.address.region?''+site.address.region.replace(/"/g,"'")+'':'':'',
//         postCode:site.address?site.address.postcode?''+site.address.postcode.replace(/"/g,"'")+'':'':'',
//         country:site.address?site.address.country?''+site.address.country.replace(/"/g,"'")+'':'':'',
//         lat:site.lat?''+site.lat.replace(/"/g,"'")+'':'',
//         long:site.long?''+site.long.replace(/"/g,"'")+'':'',
//         contacts:site.contactsName?''+site.contactsName.replace(/"/g,"'")+'':'',
//         billingContact:site.primaryBillingContact?getContactName(site.primaryBillingContact):'',
//         technicalContact:site.primaryTechnicalContact?getContactName(site.primaryTechnicalContact):'',
//       };
//     }


//     finalDataRow = Object.values(finalDataObj);
//     let index = 0;

//     for(let finalData of finalDataRow) {
//       finalData = finalData.replace(/(\r\n|\r|\n)/g,'');
//       finalDataRow[index] = finalData;
//       index++;
//     }

//     finalDataRow = finalDataRow.join(',');
//     finalData.push(finalDataRow);

//   }

//   let csvDataToWrite = finalData.join('\n');

//   fs.writeFile(filePath, csvDataToWrite, 'utf8', function (err) {
//     if (err) {
//       console.log('Some error occured - file either not saved or corrupted file saved.');
//       return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
//     } else{
//       return res.sendFile(filePath);
//     }
//   });
// }

exports.exportSitesJSONForCSV = async (req, res, next) => {
  try {
    const regex = new RegExp("^EXPORT_UUID$", "i");
    let EXPORT_UUID = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    EXPORT_UUID = EXPORT_UUID && EXPORT_UUID.value.trim().toLowerCase() === 'true' ? true : false;

    let queryString_ = { isActive: true, isArchived: false };
    // const fetchAllSites = req.query.fetchAllSites === true || req.query.fetchAllSites === 'true' ? true : false;
    if(ObjectId.isValid(req?.params?.customerId)) {
      queryString_.customer = req.params.customerId;
    }

    const collationOptions = {
      locale: 'en',
      strength: 2
    };

    console.log(queryString_);
    let sites = await CustomerSite.find(queryString_).collation(collationOptions).sort({name: 1})
      .populate('customer')
      .populate('primaryBillingContact')
      .populate('primaryTechnicalContact');

    sites = JSON.parse(JSON.stringify(sites));
    let listJSON = [];

    console.log("sites", sites);
    
    await Promise.all(sites.map(async (site) => {
      if (site && site.customer && (site.customer.isActive == false || site.customer.isArchived == true))
        return;

      if (Array.isArray(site.contacts) && site.contacts.length > 0) {
        site.contacts = await CustomerContact.find({ _id: { $in: site.contacts }, isActive: true, isArchived: false });
        site.contactsName = site.contacts.map((c) => `${c.firstName} ${c.lastName}`);
        site.contactsName = '"' + site.contactsName + '"';
      }

      let finalDataObj;
      if (EXPORT_UUID) {
        finalDataObj = {
          Name: site ? '' + site.name.replace(/"/g, "'") + '' : '',
          CustomerID: site.customer ? site.customer._id : '',
          Customer: site.customer ? '' + site.customer.name.replace(/"/g, "'") + '' : '',
          Street: site.address ? (site.address.street ? '' + site.address.street.replace(/"/g, "'") + '' : '') : '',
          Suburb: site.address ? (site.address.suburb ? '' + site.address.suburb.replace(/"/g, "'") + '' : '') : '',
          City: site.address ? (site.address.city ? '' + site.address.city.replace(/"/g, "'") + '' : '') : '',
          Region: site.address ? (site.address.region ? '' + site.address.region.replace(/"/g, "'") + '' : '') : '',
          PostCode: site.address ? (site.address.postcode ? '' + site.address.postcode.replace(/"/g, "'") + '' : '') : '',
          Country: site.address ? (site.address.country ? '' + site.address.country.replace(/"/g, "'") + '' : '') : '',
          Latitude: site.lat ? '' + site.lat.replace(/"/g, "'") + '' : '',
          Latitude: site.long ? '' + site.long.replace(/"/g, "'") + '' : '',
          // Contacts: site.contactsName ? '' + site.contactsName.replace(/"/g, "'") + '' : '',
          BillingContact: site.primaryBillingContact ? getContactName(site.primaryBillingContact) : '',
          BillingContactID: site.primaryBillingContact ? site.primaryBillingContact._id : '',
          TechnicalContact: site.primaryTechnicalContact ? getContactName(site.primaryTechnicalContact) : '',
          TechnicalContactID: site.primaryTechnicalContact ? site.primaryTechnicalContact._id : '',
        };
      } else {
        finalDataObj = {
          Name: site ? '' + site.name.replace(/"/g, "'") + '' : '',
          Customer: site.customer ? '' + site.customer.name.replace(/"/g, "'") + '' : '',
          Street: site.address ? (site.address.street ? '' + site.address.street.replace(/"/g, "'") + '' : '') : '',
          Suburb: site.address ? (site.address.suburb ? '' + site.address.suburb.replace(/"/g, "'") + '' : '') : '',
          City: site.address ? (site.address.city ? '' + site.address.city.replace(/"/g, "'") + '' : '') : '',
          Region: site.address ? (site.address.region ? '' + site.address.region.replace(/"/g, "'") + '' : '') : '',
          PostCode: site.address ? (site.address.postcode ? '' + site.address.postcode.replace(/"/g, "'") + '' : '') : '',
          Country: site.address ? (site.address.country ? '' + site.address.country.replace(/"/g, "'") + '' : '') : '',
          Latitude: site.lat ? '' + site.lat.replace(/"/g, "'") + '' : '',
          Latitude: site.long ? '' + site.long.replace(/"/g, "'") + '' : '',
          // Contacts: site.contactsName ? '' + site.contactsName.replace(/"/g, "'") + '' : '',
          BillingContact: site.primaryBillingContact ? getContactName(site.primaryBillingContact) : '',
          TechnicalContact: site.primaryTechnicalContact ? getContactName(site.primaryTechnicalContact) : '',
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