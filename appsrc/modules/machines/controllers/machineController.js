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
this.orderBy = { createdAt: -1 };  
//this.populate = 'category';
this.populate = [
      {path: 'machineModel', select: '_id name'},
      {path: 'parentMachine', select: '_id name serialNo supplier machineModel'},
      {path: 'supplier', select: '_id name'},
      {path: 'status', select: '_id name'},
      {path: 'customer', select: '_id name'},
      {path: 'billingSite', select: '_id name'},
      {path: 'instalationSite', select: '_id name address'},
      {path: 'accountManager', select: '_id firstName lastName'},
      {path: 'projectManager', select: '_id firstName lastName'},
      {path: 'supportManager', select: '_id firstName lastName'},
      {path: 'createdBy', select: 'name'},
      {path: 'updatedBy', select: 'name'}
    ];


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
  this.query = req.query != "undefined" ? req.query : {};  
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
  console.log('calling patchMachine',req.body);
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
  const { serialNo, name, parentMachine, parentSerialNo, status, supplier, machineModel, 
    workOrderRef, customer, instalationSite, billingSite, operators,
    accountManager, projectManager, supportManager, license, logo,
    tools, description, internalTags, customerTags,
    isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new Machine({});
  }

  
  if ("serialNo" in req.body){
    doc.serialNo = serialNo;
  }
  if ("name" in req.body){
    doc.name = name;
  }
  if ("parentMachine" in req.body){
    doc.parentMachine = parentMachine;
  }
  if ("parentSerialNo" in req.body){
    doc.parentSerialNo =  parentSerialNo;
  }
  if ("status" in req.body){
    doc.status = status;
  }
  if ("supplier" in req.body){
    doc.supplier = supplier;
  }
  if ("machineModel" in req.body){
    doc.machineModel = machineModel;
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
  if ("description" in req.body){
    doc.description = description;
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
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}
