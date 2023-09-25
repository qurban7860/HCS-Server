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

const { ProductServiceRecords, Product, ProductCheckItem } = require('../models');
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
  {path: 'technician', select: 'firstName lastName'},
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
        response.decoilers = await Product.find({_id:{$in:response.decoilers}});
      }
      
      if(Array.isArray(response.operator) && response.operator.length>0) {
        response.operator = await CustomerContact.find( { _id : { $in:response.operator } }, { firstName:1, lastName:1 })
      }
      
      if(response.serviceRecordConfig && 
        Array.isArray(response.serviceRecordConfig.checkParams) &&
        response.serviceRecordConfig.checkParams.length>0) {

        let index = 0;
        for(let checkParam of response.serviceRecordConfig.checkParams) {
          if(Array.isArray(checkParam.paramList) && checkParam.paramList.length>0) {
            let indexP = 0;
            for(let paramListId of checkParam.paramList) {
              response.serviceRecordConfig.checkParams[index].paramList[indexP] = await ProductCheckItem.findById(paramListId).populate('category');
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


          if(Array.isArray(serviceRecord.operator) && serviceRecord.operator.length>0) {
            serviceRecord.operator = await CustomerContact.find( { _id : { $in : serviceRecord.operator } }, { firstName:1, lastName:1 })
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
    serviceNote, maintenanceRecommendation, checkParams, suggestedSpares, operator, operatorRemarks,
    loginUser, isActive, isArchived
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

    if(decoilers.indexOf(',')>-1 && !Array.isArray(decoilers))
      decoilers = decoilers.split(',');
    
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

  if ("checkParams" in req.body){
    doc.checkParams = checkParams;
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
  if ("operator" in req.body){
    doc.operator = operator;
  }
  if ("operatorRemarks" in req.body){
    doc.operatorRemarks = operatorRemarks;
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
