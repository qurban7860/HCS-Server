const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');

const fileUpload = require('../../../middleware/file-upload');
const multer = require("multer");

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceRecordsConfig, ProductServiceRecords, Product, ProductCheckItem } = require('../models');
const { CustomerContact } = require('../../crm/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'serviceRecordConfig', select: ''},
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
  
  this.dbservice.getObjectById(ProductServiceRecords, this.fields, req.params.id, this.populate, callbackFunc);
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
      
      // if(response.serviceRecordConfig && 
      //   Array.isArray(response.serviceRecordConfig.checkItemLists) &&
      //   response.serviceRecordConfig.checkItemLists.length>0) {

      //   let index = 0;
      //   for(let checkParam of response.serviceRecordConfig.checkItemLists) {
      //     if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
      //       let indexP = 0;
      //       for(let paramListId of checkParam.checkItems) { 
      //         response.serviceRecordConfig.checkItemLists[index].checkItems[indexP] = await ProductCheckItem.findById(paramListId).populate('category');
      //         indexP++;
      //       }
      //     }
      //     index++;
      //   }
      // }

      res.json(response);
    }
  }

};

exports.getProductServiceRecords = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  // this.orderBy = { name: 1 };
  if(!mongoose.Types.ObjectId.isValid(req.params.machineId))
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Machine ID"});

  this.query.machine = req.params.machineId;
  this.dbservice.getObjectList(ProductServiceRecords, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      if(response && Array.isArray(response) && response.length>0) {
        response = JSON.parse(JSON.stringify(response));

        let index = 0;
        for(let serviceRecord of response) {


          if(Array.isArray(serviceRecord.operators) && serviceRecord.operators.length>0) {
            serviceRecord.operators = await CustomerContact.find( { _id : { $in : serviceRecord.operators } }, { firstName:1, lastName:1 })
          }
  
          if(serviceRecord && Array.isArray(serviceRecord.decoilers) && 
            serviceRecord.decoilers.length>0) {
            serviceRecord.decoilers = await Product.find({_id:{$in:serviceRecord.decoilers}});

          }
          response[index] = serviceRecord;
          index++;
        }
      }
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

  req.body.machine = req.params.machineId;

  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

  if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);



  console.log("req.body.serviceRecordConfig", req.body.serviceRecordConfig);
  req.body.serviceRecordConfig = await ProductServiceRecordsConfig.findOne({_id: req.body.serviceRecordConfig});

  console.log(req.body.serviceRecordConfig);
  
  if(req.body.serviceRecordConfig && 
    Array.isArray(req.body.serviceRecordConfig.checkItemLists) &&
    req.body.serviceRecordConfig.checkItemLists.length>0) {

    let index = 0;
    for(let checkParam of req.body.serviceRecordConfig.checkItemLists) {
      if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
        let indexP = 0;
        for(let paramListId of checkParam.checkItems) { 
          req.body.serviceRecordConfig.checkItemLists[index].checkItems[indexP] = await ProductCheckItem.findById(paramListId).populate('category');
          console.log(req.body.serviceRecordConfig.checkItemLists[index].checkItems[indexP]);
          indexP++;
        }
      }
      index++;
    }
  }

  this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);

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
      res.status(StatusCodes.CREATED).json({ serviceRecord: response });
    }
  }
}
};

exports.patchProductServiceRecord = async (req, res, next) => {
  const errors = validationResult(req);
  
  req.body.machine = req.params.machineId;
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    
    if(!req.body.loginUser)
      req.body.loginUser = await getToken(req);
    
    this.dbservice.patchObject(ProductServiceRecords, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
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
    serviceRecordConfig, serviceDate, customer, site, machine, 
    technician, params, additionalParams, machineMetreageParams, punchCyclesParams, 
    serviceNote, maintenanceRecommendation, checkItemLists, suggestedSpares, operators, operatorRemarks,
    technicianRemarks, loginUser, isActive, isArchived
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

  if ("site" in req.body){
    doc.site = site;
  }

  if ("machine" in req.body){
    doc.machine = machine;
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
  if ("maintenanceRecommendation" in req.body){
    doc.maintenanceRecommendation = maintenanceRecommendation;
  }
  if ("suggestedSpares" in req.body){
    doc.suggestedSpares = suggestedSpares;
  }
  if ("operators" in req.body){
    doc.operators = operators;
  }
  if ("operatorRemarks" in req.body){
    doc.operatorRemarks = operatorRemarks;
  }


  if ("technicianRemarks" in req.body){
    doc.technicianRemarks = technicianRemarks;
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
