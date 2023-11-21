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

const { Product, ProductConfiguration } = require('../models');
const ObjectId = require('mongoose').Types.ObjectId;

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


exports.getProductConfiguration = async (req, res, next) => {
  this.dbservice.getObjectById(ProductConfiguration, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getProductConfigurations = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.orderBy = { createdAt: -1 };
  this.dbservice.getObjectList(ProductConfiguration, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductConfiguration = async (req, res, next) => {
  this.dbservice.deleteObject(ProductConfiguration, req.params.id, res, callbackFunc);
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

exports.postProductConfiguration = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {


    if(ObjectId.isValid(req.body.inputGUID) && req.body.inputSerialNo){
      const query__ = {_id: req.body.inputGUID, serialNo: (String(req.body.inputSerialNo).trim()) };
      let productObject = await Product.findOne(query__).select('_id');
      if(productObject && !_.isEmpty(productObject)) {
        req.body.machine = productObject._id;    
      }
    }


    let productConfObjec = getDocumentFromReq(req, 'new');
    const date = productConfObjec._id.getTimestamp();
    productConfObjec.backupid = date.toISOString().replace(/[-T:.Z]/g, '');

    this.dbservice.postObject(productConfObjec, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
        );
      } else {
        return res.status(StatusCodes.CREATED).json({ ProductConfiguration: response });
      }
    }
  }
};

exports.patchProductConfiguration = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(ProductConfiguration, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { backupid, inputGUID, inputSerialNo, machine, configuration, isActive, isArchived, loginUser} = req.body;
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductConfiguration({});
  }

  if ("backupid" in req.body){
    doc.backupid = backupid;
  }


  if ("machine" in req.body){
    doc.machine = machine;
  }

  
  if ("inputGUID" in req.body){
    doc.inputGUID = inputGUID;
  }
  
  if ("inputSerialNo" in req.body){
    doc.inputSerialNo = inputSerialNo;
  }
  
  if ("configuration" in req.body){
    doc.configuration = configuration;
  }
  
  if ("isActive" in req.body){
    doc.isActive = req.body.isActive === true || req.body.isActive === 'true' ? true : false;
  }

  if ("isArchived" in req.body){
    doc.isArchived = req.body.isArchived === true || req.body.isArchived === 'true' ? true : false;
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
