const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let machineDBService = require('../service/machineDBService')
this.dbservice = new machineDBService();

const { Machine } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };  
//this.populate = 'category';
this.populate = {path: '', select: ''};
//this.populate = {path: '<field name>', model: '<model name>', select: '<space separated field names>'};


exports.getMachine = async (req, res, next) => {
  this.dbservice.getObjectById(Machine, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getMachines = async (req, res, next) => {
  this.dbservice.getObjectList(Machine, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteMachine = async (req, res, next) => {
  this.dbservice.deleteObject(Machine, req.params.id, callbackFunc);
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

exports.postMachine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.json({ Machine: response });
      }
    }
  }
};

exports.patchMachine = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchMachine');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(Machine, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};


function getDocumentFromReq(req, reqType){
  const { serialNo, parentMachine, name, description, status, supplier, model, 
    workOrderRef, customer, instalationSite, billingSite, operators,
    accountManager, projectManager, supportManager, license, logo,
    tools, internalTags, customerTags,
    isDisabled, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new Machine({});
  }

  
  if ("serialNo" in req.body){
    doc.serialNo = serialNo;
  }
  if ("parentMachine" in req.body){
    doc.parentMachine = parentMachine;
  }

  if ("name" in req.body){
    doc.name = name;
  }
  if ("description" in req.body){
    doc.description = description;
  }
  if ("status" in req.body){
    doc.status = status;
  }

  if ("supplier" in req.body){
    doc.supplier = supplier;
  }
  if ("model" in req.body){
    doc.model = model;
  }

  if ("workOrderRef" in req.body){
    doc.workOrderRef = workOrderRef;
  }
  if ("customer" in req.body){
    doc.customer = customer;
  }
  if ("instalationSite" in req.body){
    doc.instalationSite = instalationSite;
  }
  if ("billingSite" in req.body){
    doc.billingSite = billingSite;
  }
  if ("operators" in req.body){
    doc.operators = operators;
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

  if ("license" in req.body){
    doc.license = license;
  }
  if ("logo" in req.body){
    doc.logo = logo;
  }
  if ("tools" in req.body){
    doc.tools = tools;
  }
  
  if ("internalTags" in req.body){
    doc.internalTags = internalTags;
  }
  if ("customerTags" in req.body){
    doc.customerTags = customerTags;
  }
  
  if ("isDisabled" in req.body){
    doc.isDisabled = isDisabled;
  }
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}
