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

const { ProductTechParamValue } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'},
  {path: 'techParam',  populate: { path: 'category'}},
];


exports.getProductTechParamValue = async (req, res, next) => {
  this.dbservice.getObjectById(ProductTechParamValue, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductTechParamValues = async (req, res, next) => {
  this.machineId = req.params.machineId;
  this.query = req.query != "undefined" ? req.query : {};  
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  this.query.machine = this.machineId;
  this.dbservice.getObjectList(ProductTechParamValue, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.searchProductTechParamValues = async (req, res, next) => {
  this.dbservice.getObjectList(ProductTechParamValue, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductTechParamValue = async (req, res, next) => {
  this.dbservice.deleteObject(ProductTechParamValue, req.params.id, res, callbackFunc);
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

exports.postProductTechParamValue = async (req, res, next) => {
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
        res.status(StatusCodes.CREATED).json({ MachineTechParamValue: response });
      }
    }
  }
};

exports.patchProductTechParamValue = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(ProductTechParamValue, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { techParam, techParamValue, activatedAt, expiryDate, note, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductTechParamValue({});
  }

  if ("machine" in req.body){
    doc.machine = req.body.machine;
  }else{
    doc.machine = req.params.machineId;
  }
  if ("techParam" in req.body){
    doc.techParam = techParam;
  }
  if ("techParamValue" in req.body){
    doc.techParamValue = techParamValue;
  }
  if ("activatedAt" in req.body){
    doc.activatedAt = activatedAt;
  }
  if ("expiryDate" in req.body){
    doc.expiryDate = expiryDate;
  }
  if ("note" in req.body){
    doc.note = note;
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
