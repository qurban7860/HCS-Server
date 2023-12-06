const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');
const { render } = require('template-file');
const fs = require('fs');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const emailController = require('../../email/controllers/emailController');
const { ProductServiceRecords, ProductServiceRecordValue, Product, ProductCheckItem } = require('../models');
const { CustomerContact } = require('../../crm/models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'serviceRecordConfig', select: 'docTitle recordType'},
  {path: 'customer', select: 'name'},
  {path: 'site', select: 'name'},
  {path: 'machine', select: 'name serialNo'},
  {path: 'technician', select: 'name firstName lastName'},
  // {path: 'operator', select: 'firstName lastName'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductServiceRecord = async (req, res, next) => {
  let populateObject = [
    {path: 'serviceRecordConfig', select: 'docTitle recordType checkItemLists enableNote footer header enableMaintenanceRecommendations enableSuggestedSpares isOperatorSignatureRequired'},
    {path: 'customer', select: 'name'},
    {path: 'site', select: 'name'},
    {path: 'machine', select: 'name serialNo'},
    {path: 'technician', select: 'name firstName lastName'},
    // {path: 'operator', select: 'firstName lastName'},
    {path: 'createdBy', select: 'name'},
    {path: 'updatedBy', select: 'name'}
  ];

  this.dbservice.getObjectById(ProductServiceRecords, this.fields, req.params.id, populateObject, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      response = JSON.parse(JSON.stringify(response));

      if(response && Array.isArray(response.decoilers) && response.decoilers.length>0) {
        response.decoilers = await Product.find({_id:{$in:response.decoilers},isActive:true,isArchived:false});
      }
      
      if(Array.isArray(response.operators) && response.operators.length>0) {
        response.operators = await CustomerContact.find( { _id : { $in:response.operators } }, { firstName:1, lastName:1 });
      }

      // fetching active values.
      let listProductServiceRecordValues = await ProductServiceRecordValue.find({
        serviceId: response.serviceId,
        isHistory: false, isActive: true, isArchived: false
      }, {checkItemValue: 1, comments: 1, serviceRecord: 1, checkItemListId: 1, machineCheckItem: 1, createdBy: 1, createdAt: 1}).populate([{path: 'createdBy', select: 'name'}, {path: 'serviceRecord', select: 'versionNo'}]);
      listProductServiceRecordValues = JSON.parse(JSON.stringify(listProductServiceRecordValues));

      // fetching history values.
      let listProductServiceRecordHistoryValues = await ProductServiceRecordValue.find({
        serviceId: response.serviceId,
        isHistory: true, isActive: true, isArchived: false
      }, {serviceRecord:1, checkItemListId:1, machineCheckItem:1, checkItemValue: 1, comments: 1, createdBy: 1, createdAt: 1}).populate([{path: 'createdBy', select: 'name'}, {path: 'serviceRecord', select: 'versionNo'}]).sort({createdAt: -1});
      listProductServiceRecordHistoryValues = JSON.parse(JSON.stringify(listProductServiceRecordHistoryValues));

    
      if(response.serviceRecordConfig && 
        Array.isArray(response.serviceRecordConfig.checkItemLists) &&
        response.serviceRecordConfig.checkItemLists.length>0) {
        let index = 0;
        for(let checkParam of response.serviceRecordConfig.checkItemLists) {
          if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
            let indexP = 0;
            let productCheckItemObjects = await ProductCheckItem.find({_id:{$in:checkParam.checkItems}});
            productCheckItemObjects = JSON.parse(JSON.stringify(productCheckItemObjects));

            for(let paramListId of checkParam.checkItems) { 
              // let productCheckItemObject = await ProductCheckItem.findById(paramListId);
              let productCheckItemObject = productCheckItemObjects.find((PCIO)=>paramListId.toString()==PCIO._id.toString());
              
              if(!productCheckItemObject)
                continue;
              
              let PSRV = listProductServiceRecordValues.find((psrval)=>              
                psrval.machineCheckItem.toString() == paramListId && 
                psrval.checkItemListId.toString() == checkParam._id
              );

              let matchedHistoryVal = listProductServiceRecordHistoryValues.filter((psrval) => {
                return (
                  psrval.machineCheckItem.toString() === paramListId &&
                  psrval.checkItemListId.toString() === checkParam._id
                );
              });

              if(PSRV) {
                productCheckItemObject.recordValue = {
                  serviceRecord : PSRV.serviceRecord,
                  checkItemValue : PSRV.checkItemValue,
                  comments : PSRV.comments,
                  createdBy : PSRV.createdBy,
                  createdAt : PSRV.createdAt
                }
              }
              if(matchedHistoryVal)
                productCheckItemObject.historicalData = matchedHistoryVal;

              response.serviceRecordConfig.checkItemLists[index].checkItems[indexP] = productCheckItemObject;
              indexP++;
            }
          }
          index++;
        }
      }

      res.json(response);
    }
  }

};

exports.getProductServiceRecordWithIndividualDetails = async (req, res, next) => {
  let populateObject = [
    {path: 'serviceRecordConfig', select: 'docTitle recordType checkItemLists enableNote footer header enableMaintenanceRecommendations enableSuggestedSpares isOperatorSignatureRequired'},
    {path: 'customer', select: 'name'},
    {path: 'site', select: 'name'},
    {path: 'machine', select: 'name serialNo'},
    {path: 'technician', select: 'name firstName lastName'},
    // {path: 'operator', select: 'firstName lastName'},
    {path: 'createdBy', select: 'name'},
    {path: 'updatedBy', select: 'name'}
  ];

  this.dbservice.getObjectById(ProductServiceRecords, this.fields, req.params.id, populateObject, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      response = JSON.parse(JSON.stringify(response));

      if(response && Array.isArray(response.decoilers) && response.decoilers.length>0) {
        response.decoilers = await Product.find({_id:{$in:response.decoilers},isActive:true,isArchived:false});
      }
      
      if(Array.isArray(response.operators) && response.operators.length>0) {
        response.operators = await CustomerContact.find( { _id : { $in:response.operators } }, { firstName:1, lastName:1 });
      }

      // fetching active values.
      let listProductServiceRecordValues = await ProductServiceRecordValue.find({
        serviceRecord: req.params.id,
        isArchived: false
      }, {checkItemValue: 1, comments: 1, serviceRecord: 1, checkItemListId: 1, machineCheckItem: 1, createdBy: 1, createdAt: 1}).populate([{path: 'createdBy', select: 'name'}, {path: 'serviceRecord', select: 'versionNo'}]);
      listProductServiceRecordValues = JSON.parse(JSON.stringify(listProductServiceRecordValues));     

      if(response.serviceRecordConfig && 
        Array.isArray(response.serviceRecordConfig.checkItemLists) &&
        response.serviceRecordConfig.checkItemLists.length>0) {
        let index = 0;
        for(let checkParam of response.serviceRecordConfig.checkItemLists) {
          if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
            let indexP = 0;
            let productCheckItemObjects = await ProductCheckItem.find({_id:{$in:checkParam.checkItems}});
            productCheckItemObjects = JSON.parse(JSON.stringify(productCheckItemObjects));

            for(let paramListId of checkParam.checkItems) { 
              // let productCheckItemObject = await ProductCheckItem.findById(paramListId);
              let productCheckItemObject = productCheckItemObjects.find((PCIO)=>paramListId.toString()==PCIO._id.toString());
              
              if(!productCheckItemObject)
                continue;
              
              let PSRV = listProductServiceRecordValues.find((psrval)=>              
                psrval.machineCheckItem.toString() == paramListId && 
                psrval.checkItemListId.toString() == checkParam._id
              );




              if(PSRV) {
                productCheckItemObject.recordValue = {
                  serviceRecord : PSRV.serviceRecord,
                  checkItemValue : PSRV.checkItemValue,
                  comments : PSRV.comments,
                  createdBy : PSRV.createdBy,
                  createdAt : PSRV.createdAt
                }
                productCheckItemObject.serviceRecord = PSRV.serviceRecord;                
                productCheckItemObject.checkItemValue = PSRV.checkItemValue;
                productCheckItemObject.comments = PSRV.comments;
                productCheckItemObject.createdBy = PSRV.createdBy;
                productCheckItemObject.createdAt = PSRV.createdAt;
              }

              response.serviceRecordConfig.checkItemLists[index].checkItems[indexP] = productCheckItemObject;
              indexP++;
            }
          }
          index++;
        }
      }
      let currentVersion_ = await ProductServiceRecords.findOne(
      {serviceId: response.serviceId, isActive: true, isArchived: false}, 
      {versionNo: 1, _id: 1}).sort({_id: -1});
      currentVersion_ = JSON.parse(JSON.stringify(currentVersion_));     
      response.currentVersion = currentVersion_;
      res.json(response);
    }
  }
};

exports.getProductServiceRecords = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  if(!mongoose.Types.ObjectId.isValid(req.params.machineId))
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Machine ID"});

  this.query.machine = req.params.machineId;
  this.dbservice.getObjectList(ProductServiceRecords, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      console.log("error", error);
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductServiceRecord = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceRecords, req.params.id, res, callbackFunc);
  //console.log(req.params.id);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductServiceRecord = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

  if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);
  }

  let productServiceRecordObject = getDocumentFromReq(req, 'new');
  productServiceRecordObject.versionNo = 1;
  productServiceRecordObject.serviceId = productServiceRecordObject._id;

  this.dbservice.postObject(productServiceRecordObject, callbackFunc);

  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        error._message
      );
    } else {
      if(response && Array.isArray(response.decoilers) && response.decoilers.length>0) {
        response = JSON.parse(JSON.stringify(response));
        response.decoilers = await Product.find({_id:{$in:response.decoilers}});
      }

      if(req.body.serviceRecordConfig && 
        Array.isArray(req.body.checkItemRecordValues) &&
        req.body.checkItemRecordValues.length>0) {
        if(Array.isArray(req.body.checkItemRecordValues) && req.body.checkItemRecordValues.length>0) {
        for(let recordValue of req.body.checkItemRecordValues) {
            recordValue.loginUser = req.body.loginUser;
            recordValue.serviceRecord = response._id;
            recordValue.serviceId = response._id;
            let serviceRecordValue = productServiceRecordValueDocumentFromReq(recordValue, 'new');
              let serviceRecordValuess = await serviceRecordValue.save((error, data) => {
              if (error) {
                console.error(error);
              } else {

              }
            });
          }
        }
      }

      res.status(StatusCodes.CREATED).json({ serviceRecord: response });
    }
  }
}

exports.sendServiceRecordEmail = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST)); 
  } else {
    const file_ = req.file;
    const emailAddress = req.body.email;
    if (!file_) {
      return res.status(400).send('No file uploaded!');
    };

    if (!validateEmail(emailAddress)) {
      return res.status(400).send('Email validation failded!');
    }

    const serviceRecObj = await ProductServiceRecords.findOne({ _id: req.params.id, isActive: true, isArchived: false })
      .populate([{ path: 'customer', select: 'name type isActive isArchived'}, { path: 'machine', select: 'serialNo'}, { path: 'createdBy', select: 'name'}]);

    if (serviceRecObj) {
      let emailSubject = `Service Record PDF attached`;

      let params = {
        to: emailAddress,
        subject: emailSubject,
        html: true,
      };

      fs.readFile(file_.path, (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }

        // Use the file content as a buffer
        file_.buffer = data;
        const email = req.body.email;

        // Now you can work with the file buffer as needed
        console.log(file_.buffer);
      });


      let username = serviceRecObj.name;
      let hostName = 'portal.howickltd.com';

      if (process.env.CLIENT_HOST_NAME)
        hostName = process.env.CLIENT_HOST_NAME;

      let hostUrl = "https://portal.howickltd.com";

      if (process.env.CLIENT_APP_URL)
        hostUrl = process.env.CLIENT_APP_URL;

      let serviceDate=serviceRecObj.serviceDate;
      const SDdateObject = new Date(serviceDate);
      const SDyear = SDdateObject.getFullYear();
      const SDmonth = SDdateObject.getMonth() + 1;
      const SDday = SDdateObject.getDate();
      serviceDate = `${SDyear}-${SDmonth < 10 ? '0' : ''}${SDmonth}-${SDday < 10 ? '0' : ''}${SDday}`;

      const versionNo=serviceRecObj.versionNo;
      const serialNo=serviceRecObj.machine?.serialNo;
      const customer=serviceRecObj.customer?.name;
      const createdBy=serviceRecObj.createdBy?.name;


      let createdAt=serviceRecObj.createdAt;
      const dateObject = new Date(createdAt);
      const year = dateObject.getFullYear();
      const month = dateObject.getMonth() + 1;
      const day = dateObject.getDate();
      createdAt = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
      
      fs.readFile(__dirname + '/../../email/templates/service-record.html', 'utf8', async function (err, data) {
        let link = "";
        let htmlData = render(data, { hostName, hostUrl, username, link, serviceDate, versionNo, serialNo, customer, createdAt, createdBy })
        params.htmlData = htmlData;
        const awsService = require('../../../../appsrc/base/aws');
        let response = await awsService.sendEmailWithRawData(params, file_);
      })

      const emailResponse = await addEmail(params.subject, params.htmlData, serviceRecObj, params.to);

      _this.dbservice.postObject(emailResponse, callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Email sent successfully!', false));
        }
      }
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Service Record configuration not found!', true));
    }
  }
};

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function addEmail(subject, body, toUser, emailAddresses, fromEmail='', ccEmails = [],bccEmails = []) {
  var email = {
    subject,
    body,
    toEmails:emailAddresses,
    fromEmail:process.env.AWS_SES_FROM_EMAIL,
    customer:'',
    toContacts:[],
    toUsers:[],
    ccEmails,
    bccEmails,
    isArchived: false,
    isActive: true,
    // loginIP: ip,
    createdBy: '',
    updatedBy: '',
    createdIP: ''
  };
  if(toUser && mongoose.Types.ObjectId.isValid(toUser.id)) {
    email.toUsers.push(toUser.id);
    console.log("toUser.customer", toUser.customer, toUser.customer.id);

    if(toUser.customer && toUser.customer.id && mongoose.Types.ObjectId.isValid(toUser.customer.id)) {
      email.customer = toUser.customer.id;
    }

    if(toUser.contact && mongoose.Types.ObjectId.isValid(toUser.contact.id)) {
      email.toContacts.push(toUser.contact.id);
    }
  }
  
  var reqEmail = {};

  reqEmail.body = email;
  
  const res = emailController.getDocumentFromReq(reqEmail, 'new');
  return res;
}

exports.patchProductServiceRecord = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    
    if(!req.body.loginUser)
      req.body.loginUser = await getToken(req);

    if(req.body.isArchived == true) {
      const result = await this.dbservice.patchObject(ProductServiceRecords, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } else {
      let parentProductServiceRecordObject = await ProductServiceRecords.findOne({serviceId: req.body.serviceId, isActive:true,isArchived:false}).sort({_id: -1});
      let productServiceRecordObject = getDocumentFromReq(req, 'new');
      productServiceRecordObject.versionNo = parentProductServiceRecordObject.versionNo + 1; //what will be the version.
      productServiceRecordObject.serviceId = parentProductServiceRecordObject.serviceId;
      
      this.dbservice.postObject(productServiceRecordObject, callbackFunc);
      async function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            error._message
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
        } else {
          let queryToUpdateRecords = { serviceId: req.body.serviceId, _id: { $ne:  result._id.toString()} };
          await ProductServiceRecords.updateMany(
            queryToUpdateRecords, 
            { $set: { isHistory: true } } 
          );
  
          if(req.body.serviceRecordConfig && 
            Array.isArray(req.body.checkItemRecordValues) &&
            req.body.checkItemRecordValues.length>0) {
            if(Array.isArray(req.body.checkItemRecordValues) && req.body.checkItemRecordValues.length>0) {
            for(let recordValue of req.body.checkItemRecordValues) {
                recordValue.loginUser = req.body.loginUser;
                recordValue.serviceRecord = productServiceRecordObject._id;
                recordValue.serviceId = req.body.serviceId;
                let serviceRecordValue = productServiceRecordValueDocumentFromReq(recordValue, 'new');
                
                await ProductServiceRecordValue.updateMany({machineCheckItem: recordValue.machineCheckItem, 
                checkItemListId: recordValue.checkItemListId},{$set: {isHistory: true}});
               

                  let serviceRecordValues = await serviceRecordValue.save((error, data) => {
                  if (error) {
                    console.error(error);
                  }
                });
              }
            }
          }
          // let query__ = {serviceId: result.serviceId,   $nor: [
          //   { serviceRecord: result._id }
          // ]};
          // console.log("query__", query__);
          // await ProductServiceRecordValue.updateMany(query__,{$set: {isHistory: false}});
          res.status(StatusCodes.CREATED).json({ serviceRecord: result });
        }
      }  
    }
  }
};

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

function getDocumentFromReq(req, reqType){
  const { 
    serviceRecordConfig, serviceId, serviceDate, versionNo, customer, site, 
    technician, params, additionalParams, machineMetreageParams, punchCyclesParams, 
    serviceNote, recommendationNote, internalComments, checkItemLists, suggestedSpares, internalNote, operators, operatorNotes,
    technicianNotes, textBeforeCheckItems, textAfterCheckItems, isHistory, loginUser, isActive, isArchived
  } = req.body;
    
  let { decoilers } = req.body;
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecords({});
  }


  if ("serviceRecordConfig" in req.body){
    doc.serviceRecordConfig = serviceRecordConfig;
  }

  if ("customer" in req.body){
    doc.customer = customer;
  }

  if ("serviceId" in req.body){
    doc.serviceId = serviceId;
  }
  
  if ("versionNo" in req.body){
    doc.versionNo = versionNo;
  }
  

  if ("site" in req.body){
    doc.site = site;
  }

  if (req.params.machineId){
    doc.machine = req.params.machineId;
  }

  if ("decoilers" in req.body){
    doc.decoilers = decoilers;
  }

  if ("technician" in req.body){
    doc.technician = technician;
  }

  if ("params" in req.body){
    doc.params = params;
  }

  if ("additionalParams" in req.body){
    doc.additionalParams = additionalParams;
  }
  if ("machineMetreageParams" in req.body){
    doc.machineMetreageParams = machineMetreageParams;
  }
  if ("punchCyclesParams" in req.body){
    doc.punchCyclesParams = punchCyclesParams;
  }

  if ("checkItemLists" in req.body){
    doc.checkItemLists = checkItemLists;
  }

  if ("serviceNote" in req.body){
    doc.serviceNote = serviceNote;
  }

  if ("serviceDate" in req.body){
    doc.serviceDate = serviceDate;
  }
  if ("recommendationNote" in req.body){
    doc.recommendationNote = recommendationNote;
  }
  if ("internalComments" in req.body){
    doc.internalComments = internalComments;
  }
  if ("suggestedSpares" in req.body){
    doc.suggestedSpares = suggestedSpares;
  }
  if ("internalNote" in req.body){
    doc.internalNote = internalNote;
  }
  if ("operators" in req.body){
    doc.operators = operators;
  }
  if ("operatorNotes" in req.body){
    doc.operatorNotes = operatorNotes;
  }
  if ("technicianNotes" in req.body){
    doc.technicianNotes = technicianNotes;
  }

  if ("textBeforeCheckItems" in req.body){
    doc.textBeforeCheckItems = textBeforeCheckItems;
  }
  
  if ("textAfterCheckItems" in req.body){
    doc.textAfterCheckItems = textAfterCheckItems;
  }

  if ("isHistory" in req.body){
    doc.isHistory = isHistory;
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

  //console.log("doc in http req: ", doc);
  return doc;

}


function productServiceRecordValueDocumentFromReq(recordValue, reqType){
  const { serviceRecord, serviceId, machineCheckItem, checkItemListId, checkItemValue, comments, files , isHistory, isActive, isArchived } = recordValue;
  const { loginUser } = recordValue;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordValue({});
  }

  if ("serviceRecord" in recordValue) {
    doc.serviceRecord = serviceRecord;
  }

  if ("serviceId" in recordValue) {
    doc.serviceId = serviceId;
  }

  if ("machineCheckItem" in recordValue) {
    doc.machineCheckItem = machineCheckItem;
  }
  
  if ("checkItemListId" in recordValue) {
    doc.checkItemListId = checkItemListId;
  }
  
  if ("checkItemValue" in recordValue) {
    doc.checkItemValue = checkItemValue;
  }
  
  if ("comments" in recordValue) {
    doc.comments = comments;
  }
  
  if ("files" in recordValue) {
    doc.files = files;
  }
  
  if ("isHistory" in recordValue){
    doc.isHistory = isHistory;
  }
  
  if ("isActive" in recordValue){
    doc.isActive = isActive;
  }
  
  if ("isArchived" in recordValue){
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in recordValue ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in recordValue) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  return doc;
}
