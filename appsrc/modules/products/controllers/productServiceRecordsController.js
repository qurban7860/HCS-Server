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
const awsService = require('../../../../appsrc/base/aws');
const { Config } = require('../../config/models');
const path = require('path');
const sharp = require('sharp');
const { customTimestamp } = require('../../../../utils/formatTime');
const { renderEmail } = require('../../email/utils');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const emailController = require('../../email/controllers/emailController');
const { ProductServiceRecords, ProductServiceRecordFiles , ProductServiceRecordValue, ProductServiceRecordValueFile, Product, ProductModel, ProductCheckItem } = require('../models');
const { CustomerContact } = require('../../crm/models');
const util = require('util');

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
  {path: 'operators', select: 'firstName lastName'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

this.populateObject = [
  {path: 'serviceRecordConfig', select: 'docTitle recordType checkItemLists enableNote footer header enableMaintenanceRecommendations enableSuggestedSpares isOperatorSignatureRequired'},
  {path: 'customer', select: 'name'},
  {path: 'site', select: 'name'},
  {path: 'machine', select: 'name serialNo machineModel'},
  {path: 'technician', select: 'name firstName lastName'},
  {path: 'operators', select: 'firstName lastName'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

exports.getProductServiceRecord = async (req, res, next) => {

  this.dbservice.getObjectById(ProductServiceRecords, this.fields, req.params.id, this.populateObject, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      response = JSON.parse(JSON.stringify(response));  

      const queryToFindCurrentVer = {serviceId: response.serviceId, isActive: true, isArchived: false, isHistory: false};
      const currentVersion = await ProductServiceRecords.findOne(queryToFindCurrentVer).select('_id versionNo serviceDate serviceId').sort({versionNo: -1}).lean();
      response.currentVersion = currentVersion;
      if(response && Array.isArray(response.decoilers) && response.decoilers.length>0) {
        response.decoilers = await Product.find({_id:{$in:response.decoilers},isActive:true,isArchived:false});
      }

      if(response.machine && response.machine.machineModel){
        response.machine.machineModel = await ProductModel.findOne({_id: response.machine.machineModel}, {name: 1});
      }
      
      if(Array.isArray(response.operators) && response.operators.length>0) {
        response.operators = await CustomerContact.find( { _id : { $in:response.operators } }, { firstName:1, lastName:1 });
      }
        const serviceRecordFileQuery = { serviceId: { $in: response.serviceId }, isArchived: false };
        let serviceRecordFiles = await ProductServiceRecordFiles.find(serviceRecordFileQuery).select('name path extension fileType thumbnail');
        if( Array.isArray(serviceRecordFiles) && serviceRecordFiles?.length > 0 ){
          response.files = serviceRecordFiles;
        }
      res.json(response);
    }
  }
};

exports.getProductServiceRecordWithIndividualDetails = async (req, res, next) => {

  this.dbservice.getObjectById(ProductServiceRecords, this.fields, req.params.id, this.populateObject, callbackFunc);
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
  this.dbservice.getObjectList(req, ProductServiceRecords, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      console.log("error", error);
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      if (response?.length === 0) res.json(response)
      else {
        const responseWithCurrentVersion = getCurrentVersionToProductServiceRecords(response)
        res.json(responseWithCurrentVersion);
      }
    }
  }
};

const getCurrentVersionToProductServiceRecords = (docServiceRecordsList) => {
  const serviceRecordObjectsArr = docServiceRecordsList.map((model) => model.toObject());
  const currentLatestVersion = serviceRecordObjectsArr
    .map((record) => {
      return { serviceId: record.serviceId.toString(), versionNo: record.versionNo, _id: record._id };
    })
    .reduce((accVersion, currentItem) => {
      if (currentItem.serviceId in accVersion) {
        if (currentItem.versionNo > accVersion[currentItem.serviceId].versionNo) {
          return { ...accVersion, [currentItem.serviceId]: { versionNo: currentItem.versionNo, _id: currentItem._id } };
        }
        return accVersion;
      } else
        return { ...accVersion, [currentItem.serviceId]: { versionNo: currentItem.versionNo, _id: currentItem._id } };
    }, {});
  const serviceRecordsListWithHistory = serviceRecordObjectsArr.map((object) => {
    const currentVersion = {
      _id: currentLatestVersion[object.serviceId]._id,
      versionNo: currentLatestVersion[object.serviceId].versionNo,
    };
    return { ...object, currentVersion };
  });
  return serviceRecordsListWithHistory;
};

exports.deleteProductServiceRecord = async (req, res, next) => {
  try{
    req.body.isArchived = true;
    const serviceRecObj = await ProductServiceRecords.findOne({ _id: req.params.id }).select('status')
    if( serviceRecObj?.status?.toLowerCase() === 'draft'){
      await ProductServiceRecordValueFile.updateMany( { serviceRecord: req.params.id }, { $set: { isArchived: true } } );
      await ProductServiceRecordFiles.updateMany( { machineServiceRecord: req.params.id }, { $set: { isArchived: true } } );
    }
      const result = await this.dbservice.patchObject(ProductServiceRecords, req.params.id, getDocumentFromReq(req), callbackFunc );
      function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      }
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  } 

  this.dbservice.deleteObject(ProductServiceRecords, req.params.id, res, callbackFunc);
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

  if(!mongoose.Types.ObjectId.isValid(req.params.machineId)){
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Machine ID"});
  }
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    
    if(!req.body.loginUser)
      req.body.loginUser = await getToken(req);
  }
  
  const machine = await Product.findById(req.params.machineId)
  
  let productServiceRecordObject = await getDocumentFromReq(req, 'new');
  productServiceRecordObject.status = 'DRAFT';
  productServiceRecordObject.serviceRecordUid = `${machine?.serialNo || '' } - ${customTimestamp( new Date())?.toString()}`;
  productServiceRecordObject.serviceId = productServiceRecordObject?._id;
  productServiceRecordObject.customer = machine?.customer;

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

      req.machineServiceRecord = response._id;
      req.machineId = req.params.machineId;

      // Pass control to the next middleware for file upload processing
      if (req.files && req.files.images) {
        return next(); 
      }
      res.status(StatusCodes.CREATED).json({ serviceRecord: response });
    }
  }
}


exports.newProductServiceRecordVersion = async (req, res, next) => {
  try{
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if(!mongoose.Types.ObjectId.isValid(req.params.machineId)){
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid Machine ID");
    } 

    const machine = await Product.findById(req.params.machineId).populate([{ path: 'customer', populate: { path: 'mainSite'}}])
    if(!machine?._id){
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid Machine ID");
    }

    const productServiceRecord = await ProductServiceRecords.findById(req.params.id);
    if(!productServiceRecord?._id){
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid Service Record ID");
    }
    if(!productServiceRecord?.isActive){
      return res.status(StatusCodes.BAD_REQUEST).send("Service Record is not active!");
    }

    const findDraftServiceRecord = await ProductServiceRecords.findOne({
      serviceId: productServiceRecord?.serviceId, status: 'DRAFT', isArchived: false
    }).populate( this.populateObject ).sort({ _id: -1 });
    
    if(findDraftServiceRecord?._id){
      return res.status(StatusCodes.OK).json( findDraftServiceRecord );
    }
    let productServiceRecordObject = {};
    const parentProductServiceRecordObject = await ProductServiceRecords.findOne(
      { serviceId: productServiceRecord?.serviceId, isActive: true, isArchived: false }
    ).sort({ _id: -1 });

    productServiceRecordObject.serviceId = parentProductServiceRecordObject?.serviceId || productServiceRecord?.serviceId;

    req.body.serviceRecordConfig = parentProductServiceRecordObject?.serviceRecordConfig  || null;
    req.body.serviceRecordUid = parentProductServiceRecordObject?.serviceRecordUid;
    req.body.versionNo = parentProductServiceRecordObject?.versionNo + 1;
    req.body.serviceId = parentProductServiceRecordObject?.serviceId  || null;
    req.body.customer = machine?.customer?._id || null;
    req.body.site = machine?.customer?.mainSite?._id || null;
    req.body.status = 'DRAFT';
    req.body.machine = machine?._id || null;
    req.body.decoilers = parentProductServiceRecordObject?.decoilers || [];
    req.body.operators = parentProductServiceRecordObject?.operators || [];
    req.body.technician = parentProductServiceRecordObject?.technician || null;
    req.body.operatorNotes = parentProductServiceRecordObject?.operatorNotes || '';
    req.body.technicianNotes = parentProductServiceRecordObject?.technicianNotes || '';
    req.body.textBeforeCheckItems = parentProductServiceRecordObject?.textBeforeCheckItems || '';
    req.body.textAfterCheckItems = parentProductServiceRecordObject?.textAfterCheckItems || '';
    req.body.internalComments = parentProductServiceRecordObject?.internalComments || '';
    req.body.internalNote = parentProductServiceRecordObject?.internalNote || '';
    req.body.recommendationNote = parentProductServiceRecordObject?.recommendationNote || '';
    req.body.serviceNote = parentProductServiceRecordObject?.serviceNote || '';
    req.body.suggestedSpares = parentProductServiceRecordObject?.suggestedSpares || '';
    req.body.isHistory = true;

    productServiceRecordObject = getDocumentFromReq(req, 'new');
    const result = await productServiceRecordObject.save();
    // await updateOtherServiceRecords(req, productServiceRecordObject);
    const serviceRecordFileQuery = { serviceId:{ $in: parentProductServiceRecordObject?.serviceId }, isArchived: false };
    let serviceRecordFiles = await ProductServiceRecordFiles.find(serviceRecordFileQuery).select('name path extension fileType thumbnail');
    if( Array.isArray(serviceRecordFiles) && serviceRecordFiles?.length > 0 ){
      result.files = serviceRecordFiles;
    }
    return res.status(StatusCodes.OK).json(result);
  }catch(err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("New version create failed!"); 
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
      .populate([{ path: 'customer', select: 'name'}, { path: 'machine', select: 'serialNo'}, { path: 'createdBy', select: 'name'}]);

    if (serviceRecObj) {
      let emailSubject = `Service Record PDF attached`;

      let params = {
        to: emailAddress,
        subject: emailSubject,
        html: true,
      };
      
      const readFileAsync = util.promisify(fs.readFile);
      try {
        const data = await readFileAsync(file_.path);
        file_.buffer = data;
      } catch (err) {
        console.error('Error reading file:', err);
      }
      
      const username = serviceRecObj.name;
      const SDdateObject = new Date( serviceRecObj.serviceDate );
      const SDmonth = SDdateObject.getMonth() + 1;
      const SDday = SDdateObject.getDate();
      const serviceDate = `${SDdateObject.getFullYear()}-${(SDmonth) < 10 ? '0' : ''}${SDmonth}-${SDday < 10 ? '0' : ''}${SDday}`;
      const versionNo=serviceRecObj.versionNo;
      const serviceRecordId=serviceRecObj.serviceRecordUid
      const serialNo=serviceRecObj.machine?.serialNo;
      const customer=serviceRecObj.customer?.name;
      const createdBy=serviceRecObj.createdBy?.name;

      let createdAt=serviceRecObj.createdAt;
      const dateObject = new Date(createdAt);
      const year = dateObject.getFullYear();
      const month = dateObject.getMonth() + 1;
      const day = dateObject.getDate();
      createdAt = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
      
      const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/serviceRecord.html'), 'utf8');
      const content = render(contentHTML, { username, serviceDate, serviceRecordId, versionNo, serialNo, customer, createdAt, createdBy });
      const htmlData =  await renderEmail(emailSubject, content )
      params.htmlData = htmlData;
      try{
        await awsService.sendEmailWithRawData(params, file_);
      }catch(e){
        res.status(StatusCodes.OK).send('Email Send Fails!');
      }

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
    if(toUser.customer != null && toUser.customer != "undefined" && toUser.customer.id && mongoose.Types.ObjectId.isValid(toUser.customer.id)) {
      email.customer = toUser.customer.id;
    } else {
      email.customer = null;
    }

    if(toUser.contact != null && toUser.contact != undefined && toUser.contact && mongoose.Types.ObjectId.isValid(toUser.contact.id)) {
      email.toContacts.push(toUser.contact.id);
    } else {
      email.toContacts = null;
    }
  }
  
  var reqEmail = {};

  reqEmail.body = email;
  
  const res = emailController.getDocumentFromReq(reqEmail, 'new');
  return res;
}

exports.patchProductServiceRecord = async (req, res ) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty() || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (!req.body.loginUser) {
      req.body.loginUser = await getToken(req);
    }

    const findServiceRecord = await ProductServiceRecords.findById(req.params.id);
    if (!findServiceRecord) {
      return res.status(StatusCodes.NOT_FOUND).send('Service record not found');
    }

    if (req.body.isArchived === true) {
      await handleArchive(req, res);
      return;
    }


    if (req.body.status?.toLowerCase() === 'draft') {
      await checkDraftServiceRecords(req, res, findServiceRecord)
      await handleDraftStatus(req, res, findServiceRecord);
      return;
    }

    await handleOtherStatuses(req, res, findServiceRecord);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
}

const handleArchive = async (req, res) => {
  try {
    var _this = this;
    const result = await _this.dbservice.patchObject(ProductServiceRecords, req.params.id, getDocumentFromReq(req));
    return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
      console.log(error);
      return res.status(StatusCodes.BAD_REQUEST).send('Service record Archived failed!');
  }
}

const checkDraftServiceRecords = async ( req, res, findServiceRecord ) => {
  const findServiceRecords = await ProductServiceRecords.find({
    serviceId: findServiceRecord?.serviceId,
    status: 'DRAFT'
  }).sort({ _id: -1 });
  if (Array.isArray(findServiceRecords) && (findServiceRecords.length > 0 && !findServiceRecords?.some((fsr) => fsr?._id == req.params.id))) {
    res.status(StatusCodes.BAD_REQUEST).send('Service Record is already in Draft!');
  } 
}

const handleDraftStatus = async (req, res, findServiceRecord) =>{
  try{
    var _this = this;
      try {
        await checkDraftServiceRecords( req, res, findServiceRecord)
        await _this.dbservice.patchObject(ProductServiceRecords, req.params.id, getDocumentFromReq(req));
        return res.status(StatusCodes.OK).send('Draft Service Record updated!');
      } catch (e) {
        console.log(e);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Service Record updated failed!');
      }
  } catch(e){
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordUpdateMessage(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

const handleOtherStatuses = async (req, res, findServiceRecord) => {
  try{
    var _this = this;
    let productServiceRecordObject = {};
    const parentProductServiceRecordObject = await ProductServiceRecords.findOne(
      { serviceId: req.body.serviceId, isActive: true, isArchived: false }
    ).sort({ _id: -1 });
    productServiceRecordObject.serviceId = parentProductServiceRecordObject?.serviceId || req.body.serviceId;
      delete req.body.versionNo;
      productServiceRecordObject = await getDocumentFromReq(req);
      const result = await ProductServiceRecords.updateOne({ _id: req.params.id }, productServiceRecordObject )
      if(parentProductServiceRecordObject?.status?.toLowerCase() === 'draft'  && req.body?.status?.toLowerCase() === 'submitted'){
        await updateOtherServiceRecords(req, result);
      }
      if(parentProductServiceRecordObject?.status?.toLowerCase() === 'submitted'  && req.body?.status?.toLowerCase() === 'approved'){
        return res.status(StatusCodes.OK).send('Approval email sent successfully!');
      }
      return res.status(StatusCodes.OK).send('Service Record updated successfully!');
  } catch(e){
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordUpdateMessage(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

async function updateOtherServiceRecords(req, result) {
  const queryToUpdateRecords = {
    serviceId: req.body.serviceId,
    _id: { $ne: result?._id ? result._id.toString() : req.params.id },
  };
  await ProductServiceRecords.updateMany(queryToUpdateRecords, { $set: { isHistory: true } });

  if (req.body.serviceRecordConfig && Array.isArray(req.body.checkItemRecordValues) && req.body.checkItemRecordValues.length > 0) {
    for (let recordValue of req.body.checkItemRecordValues) {
      recordValue.loginUser = req.body.loginUser;
      recordValue.serviceRecord = productServiceRecordObject._id;
      recordValue.serviceId = req.body.serviceId;
      let serviceRecordValue = productServiceRecordValueDocumentFromReq(recordValue, 'new');
      await ProductServiceRecordValue.updateMany({
        machineCheckItem: recordValue.machineCheckItem,
        checkItemListId: recordValue.checkItemListId
      }, { $set: { isHistory: true } });
      await serviceRecordValue.save();
    }
  }
  return;
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

function getDocumentFromReq(req, reqType){
  const { 
    serviceRecordConfig, serviceRecordUid, serviceId, serviceDate, status, versionNo, customer, site, 
    technician, params, additionalParams, machineMetreageParams, punchCyclesParams, 
    serviceNote, recommendationNote, internalComments, checkItemLists, suggestedSpares, internalNote, operators, operatorNotes,
    technicianNotes, decoilers, textBeforeCheckItems, textAfterCheckItems, isHistory, loginUser, isActive, isArchived
  } = req.body;
  
  let doc = {};

  if (reqType && reqType == "new"){
    doc = new ProductServiceRecords({});
  }

  if ("serviceRecordConfig" in req.body){
    doc.serviceRecordConfig = serviceRecordConfig;
  }

  if ("serviceRecordUid" in req.body){
    doc.serviceRecordUid = serviceRecordUid;
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

  if ("status" in req.body){
    doc.status = status;
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


function productServiceRecordValueDocumentFromReq(recordValue, reqType){
  const { serviceRecord, serviceId, machineCheckItem, checkItemListId, checkItemValue, versionNo, comments, files , isHistory, isActive, isArchived } = recordValue;
  const { loginUser } = recordValue;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordValue({});
  }

  if ("serviceRecord" in recordValue) {
    doc.serviceRecord = serviceRecord;
  }

  if ("versionNo" in recordValue) {
    doc.versionNo = versionNo;
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
