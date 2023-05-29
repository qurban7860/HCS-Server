const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const _ = require('lodash');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { Product, ProductCategory, ProductModel } = require('../models');
const { connectMachines, disconnectMachine_ } = require('./productConnectionController');


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


exports.getProduct = async (req, res, next) => {
  this.dbservice.getObjectById(Product, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProducts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.dbservice.getObjectList(Product, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getDecoilerProducts = async (req, res, next) => {
  this.query = { name : { $regex: 'decoiler', $options: 'i' } };
  let machines = [];
  let machienCategories = await this.dbservice.getObjectList(ProductCategory, this.fields, this.query, this.orderBy, this.populate);
  if(machienCategories && machienCategories.length>0) {

    let categoryIds = machienCategories.map(c => c.id);
    let modelQuery = { category:{$in:categoryIds} };
    let machineModels = await this.dbservice.getObjectList(ProductModel, this.fields, modelQuery, this.orderBy, this.populate);
    if(machineModels && machineModels.length>0) {

      let modelsIds = machineModels.map(m => m.id);
      let machineQuery = { machineModel : {$in:modelsIds} };
      this.orderBy = {createdAt : -1};
      machines = await this.dbservice.getObjectList(Product, this.fields, machineQuery, this.orderBy, this.populate);
      res.status(StatusCodes.OK).json(machines);
    }
    else {
      res.status(StatusCodes.OK).json(machines);
    }
  }
  else {
    res.status(StatusCodes.OK).json(machines);
  }
  
};


exports.deleteProduct = async (req, res, next) => {
  this.dbservice.deleteObject(Product, req.params.id, callbackFunc);
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

exports.postProduct = async (req, res, next) => {
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
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ Machine: response });
      }
    }
  }
};

exports.patchProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let machine = await this.dbservice.getObjectById(Product, this.fields, req.params.id);

    if(machine && Array.isArray(machine.machineConnections) && 
      Array.isArray(req.body.machineConnections)) {
      
      let oldMachineConnections = machine.machineConnections;
      let newMachineConnections = req.body.machineConnections;
      let isSame = _.isEqual(oldMachineConnections.sort(), newMachineConnections.sort());

      if(!isSame) {
        let toBeConnected = newMachineConnections.filter(x => !oldMachineConnections.includes(x));
        
        if(toBeConnected.length>0) 
          machine = await connectMachines(machine.id, toBeConnected);
        

        let toBeDisconnected = oldMachineConnections.filter(x => !newMachineConnections.includes(x));

        if(toBeDisconnected.length>0) 
          machine = await disconnectMachine_(machine.id, toBeDisconnected);
        
        req.body.machineConnections = machine.machineConnections;

      }
    }
    
    this.dbservice.patchObject(Product, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { serialNo, name, parentMachine, parentSerialNo, status, supplier, machineModel, 
    workOrderRef, customer, instalationSite, billingSite, operators,
    accountManager, projectManager, supportManager, license, logo, siteMilestone,
    tools, description, internalTags, customerTags,
    isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new Product({});
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
  if ("siteMilestone" in req.body){
    doc.siteMilestone = siteMilestone;
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
