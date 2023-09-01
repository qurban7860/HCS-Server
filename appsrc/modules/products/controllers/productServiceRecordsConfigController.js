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

const { ProductServiceRecordsConfig } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductServiceRecordsConfig = async (req, res, next) => {
  this.dbservice.getObjectById(ProductServiceRecordsConfig, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductServiceRecordsConfigs = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.orderBy = { name: 1 };
  this.dbservice.getObjectList(ProductServiceRecordsConfig, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
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
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
  this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        error._message
      );
    } else {
      res.status(StatusCodes.CREATED).json({ ServiceRecordConfig: response });
    }
  }
}
};

exports.patchProductServiceRecordsConfig = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(ProductServiceRecordsConfig, req.params.id, getDocumentFromReq(req), callbackFunc);
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


function getDocumentFromReq(req, reqType){
  const { recordType, machineModel, docTitle, textBeforeParams, paramsTitle, params, 
    checkParams, enableAdditionalParams, additionalParamsTitle, additionalParams, 
    enableMachineMetreage, machineMetreageTitle, machineMetreageParams, enablePunchCycles, punchCyclesTitle, 
    punchCyclesParams, textAfterFields, isOperatorSignatureRequired, enableServiceNote, enableMaintenanceRecommendations, 
    enableSuggestedSpares, header, footer, loginUser, isActive, isArchived
} = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordsConfig({});
  }

  if ("recordType" in req.body){
    doc.recordType = recordType;
  }

  if ("machineModel" in req.body){
    doc.machineModel = machineModel;
  }

  if ("docTitle" in req.body){
    doc.docTitle = docTitle;
  }

  if ("textBeforeParams" in req.body){
    doc.textBeforeParams = textBeforeParams;
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
  if ("textAfterFields" in req.body){
    doc.textAfterFields = textAfterFields;
  }
  if ("isOperatorSignatureRequired" in req.body){
    doc.isOperatorSignatureRequired = isOperatorSignatureRequired;
  }
  if ("enableServiceNote" in req.body){
    doc.enableServiceNote = enableServiceNote;
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
