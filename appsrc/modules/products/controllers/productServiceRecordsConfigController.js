const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceRecordsConfig, ProductCheckItem, ProductModel, Product } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'machineModel', select: 'name category'},
  {path: 'category', select: 'name'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductServiceRecordsConfig = async (req, res, next) => {
  this.dbservice.getObjectById(ProductServiceRecordsConfig, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      try{
        response = JSON.parse(JSON.stringify(response));
        if(response) {
          let index = 0;
          for(let checkParam of response.checkParams) {
            if(Array.isArray(checkParam.paramList) && checkParam.paramList.length>0) {
              let indexP = 0;
              for(let paramListId of checkParam.paramList) {
                let checkItem__ = await ProductCheckItem.findOne({_id:paramListId,isActive:true,isArchived:false}).populate('category');
                
                if(checkItem__)
                  response.checkParams[index].paramList[indexP] = checkItem__;
                
                indexP++;
              }
            }
            index++;
          }
        }
        return res.json(response);

      }catch(e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }

};

exports.getProductServiceRecordsConfigs = async (req, res, next) => {

  this.query = req.query != "undefined" ? req.query : {};  
  this.orderBy = { docTitle: 1 };

  if(this.query.isArchived=='true'){
    this.query.isArchived = true
  }
  else {
    this.query.isArchived = false;
  }

  if(this.query.isActive=='false'){
    this.query.isActive = false
  }
  else {
    this.query.isActive = true;
  }

  if(req.params.machineId) {
    let machine = await Product.findOne({_id:req.params.machineId,isActive:true,isArchived:false}).populate('machineModel');
    if(machine && machine.machineModel) {
      
      this.query['$or'] = [
        { machineModel : machine.machineModel.id },
        { machineModel : {$exists :false } },
        { category : machine.machineModel.category },
        { category : {$exists :false } },
      ];
       
    }
  }

  let serviceRecordConfigs = await this.dbservice.getObjectList(ProductServiceRecordsConfig, this.fields, this.query, this.orderBy, this.populate);

  try{
    serviceRecordConfigs = JSON.parse(JSON.stringify(serviceRecordConfigs));
    let i = 0;

    if(Array.isArray(serviceRecordConfigs) && serviceRecordConfigs.length>0) {

      for(let serviceRecordConfig of serviceRecordConfigs) {

        let index = 0;
        for(let checkParam of serviceRecordConfig.checkParams) {

          if(Array.isArray(checkParam.paramList) && checkParam.paramList.length>0) {
            let indexP = 0;
            for(let paramListId of checkParam.paramList) {
              let checkItem__ = await ProductCheckItem.findOne({_id:paramListId,isActive:true,isArchived:false}).populate('category');

              if(checkItem__) {
                serviceRecordConfigs[i].checkParams[index].paramList[indexP] = checkItem__;
              }

              indexP++;
            }
          } 
          
          index++;
        }
        i++;
      }
    }
    return res.status(StatusCodes.OK).json(serviceRecordConfigs);

  }catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
  
};

exports.deleteProductServiceRecordsConfig = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceRecordsConfig, req.params.id, res, callbackFunc);
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

exports.postProductServiceRecordsConfig = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
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
      if(response && response.machineModel) {
        let machineModel = await ProductModel.findOne({_id:response.machineModel,isActive:true,isArchived:false}).populate('category');
        response = JSON.parse(JSON.stringify(response));
        if(machineModel)
          response.machineModel = machineModel;
      }
      res.status(StatusCodes.CREATED).json({ ServiceRecordConfig: response });
    }
  }
}
};

exports.patchProductServiceRecordsConfig = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    if(!req.body.loginUser)
      req.body.loginUser = await getToken(req);
    
    this.dbservice.patchObject(ProductServiceRecordsConfig, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        let machineServiceRecordConfig = await ProductServiceRecordsConfig.findOne({_id:req.params.id,isActive:true,isArchived:false}).populate('category');
        if(res && res.machineModel) {
          let machineModel = await ProductModel.findOne({_id:machineServiceRecordConfig.machineModel,isActive:true,isArchived:false}).populate('category');
          machineServiceRecordConfig = JSON.parse(JSON.stringify(machineServiceRecordConfig));
          if(machineModel)
            machineServiceRecordConfig.machineModel = machineModel;
        }
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, machineServiceRecordConfig));
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
  const { category, recordType, machineModel, docTitle, textBeforeCheckItems, paramsTitle, params, 
    checkParams, enableAdditionalParams, additionalParamsTitle, additionalParams, 
    enableMachineMetreage, machineMetreageTitle, machineMetreageParams, enablePunchCycles, punchCyclesTitle, 
    punchCyclesParams, textAfterCheckItems, isOperatorSignatureRequired, enableNote, enableMaintenanceRecommendations, 
    enableSuggestedSpares, header, footer, loginUser, isActive, isArchived
} = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordsConfig({});
  }

  if ("recordType" in req.body){
    doc.recordType = recordType;
  }

  if ("category" in req.body){
    doc.category = category;
  }


  if ("machineModel" in req.body){
    doc.machineModel = machineModel;
  }

  if ("docTitle" in req.body){
    doc.docTitle = docTitle;
  }

  if ("textBeforeCheckItems" in req.body){
    doc.textBeforeCheckItems = textBeforeCheckItems;
  }

  if ("paramsTitle" in req.body){
    doc.paramsTitle = paramsTitle;
  }

  if ("params" in req.body){
    doc.params = params;
  }

  if ("checkParams" in req.body){
    doc.checkParams = checkParams;
  }

  if ("enableAdditionalParams" in req.body){
    doc.enableAdditionalParams = enableAdditionalParams;
  }

  if ("additionalParamsTitle" in req.body){
    doc.additionalParamsTitle = additionalParamsTitle;
  }
  if ("additionalParams" in req.body){
    doc.additionalParams = additionalParams;
  }
  if ("enableMachineMetreage" in req.body){
    doc.enableMachineMetreage = enableMachineMetreage;
  }
  if ("machineMetreageTitle" in req.body){
    doc.machineMetreageTitle = machineMetreageTitle;
  }
  if ("machineMetreageParams" in req.body){
    doc.machineMetreageParams = machineMetreageParams;
  }
  if ("enablePunchCycles" in req.body){
    doc.enablePunchCycles = enablePunchCycles;
  }
  if ("punchCyclesParams" in req.body){
    doc.punchCyclesParams = punchCyclesParams;
  }
  if ("punchCyclesTitle" in req.body){
    doc.punchCyclesTitle = punchCyclesTitle;
  }
  if ("textAfterCheckItems" in req.body){
    doc.textAfterCheckItems = textAfterCheckItems;
  }
  if ("isOperatorSignatureRequired" in req.body){
    doc.isOperatorSignatureRequired = isOperatorSignatureRequired;
  }
  if ("enableNote" in req.body){
    doc.enableNote = enableNote;
  }
  if ("enableMaintenanceRecommendations" in req.body){
    doc.enableMaintenanceRecommendations = enableMaintenanceRecommendations;
  }
  if ("enableSuggestedSpares" in req.body){
    doc.enableSuggestedSpares = enableSuggestedSpares;
  }
  if ("header" in req.body){
    doc.header = header;
  }
  if ("footer" in req.body){
    doc.footer = footer;
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
