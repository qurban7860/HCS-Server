const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceRecordValue } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: '<field name>', model: '<model name>', select: '<space separated field names>'};


exports.getProductServiceRecordValue = async (req, res, next) => {
  this.dbservice.getObjectById(ProductServiceRecordValue, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductServiceRecordValues = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { name: 1 };
  this.dbservice.getObjectList(ProductServiceRecordValue, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductServiceRecordValue = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceRecordValue, req.params.id, res, callbackFunc);
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

exports.postProductServiceRecordValue = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let alreadyExists = await ProductServiceRecordValue.findOne({name:req.body.name});
    if(alreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Product Supplier with this name alreadyExists');
    }
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ ProductServiceRecordValue: response });
      }
    }
  }
};

exports.patchProductServiceRecordValue = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchProductServiceRecordValue');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let alreadyExists = await ProductServiceRecordValue.findOne({name:req.body.name,_id:{$ne:req.params.id}});
    if(alreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Product Supplier with this name alreadyExists');
    }
    this.dbservice.patchObject(ProductServiceRecordValue, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { serviceParam, name, paramListTitle, checked, value, status, comments, date,
    files, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordValue({});
  }

  if ("serviceParam" in req.body) {
    doc.serviceParam = serviceParam;
  }
  
  if ("name" in req.body) {
    doc.name = name;
  }
  
  if ("paramListTitle" in req.body) {
    doc.paramListTitle = paramListTitle;
  }
  
  if ("checked" in req.body) {
    doc.checked = checked;
  }
  
  if ("value" in req.body) {
    doc.value = value;
  }
  
  if ("status" in req.body) {
    doc.status = status;
  }
  
  if ("comments" in req.body) {
    doc.comments = comments;
  }
  
  if ("date" in req.body) {
    doc.date = date;
  }
  
  if ("files" in req.body) {
    doc.files = files;
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
