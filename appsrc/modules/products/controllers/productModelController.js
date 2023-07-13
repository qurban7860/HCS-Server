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
const ObjectId = require('mongoose').Types.ObjectId;
const { ProductModel } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'category', select: '_id name description'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductModel = async (req, res, next) => {
  this.dbservice.getObjectById(ProductModel, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductModels = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { name: 1 };
  this.dbservice.getObjectList(ProductModel, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductModel = async (req, res, next) => {
  this.dbservice.deleteObject(ProductModel, req.params.id, res, callbackFunc);
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

exports.postProductModel = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let duplicateEntry = await this.dbservice.getObject(ProductModel, {name: { $regex: req.body.name, $options: 'i' }, category: req.body.category, isArchived: false}, this.populate);
    if(duplicateEntry){
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST));
    }else{
      this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            error._message
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
        } else {
          res.status(StatusCodes.CREATED).json({ MachineModel: response });
        }
      }
    }
  }
};

exports.patchProductModel = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchProductModel');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let duplicateEntry = await this.dbservice.getObject(ProductModel, {name: req.body.name, isArchived: false}, this.populate);
    if(duplicateEntry && duplicateEntry._id != req.params.id){
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST));
    }else{
      this.dbservice.patchObject(ProductModel, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  }
};

/*
function getModelFromReq(req){
  const { name, description, category, isActive, isArchived } = req.body;
  return  new ProductModel({
    name, 
    description, 
    category,
    isActive,
    isArchived
  });
}
*/

function getDocumentFromReq(req, reqType){
  const { name, description, category, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductModel({});
  }

  if ("name" in req.body){
    doc.name = name;
  }
  if ("description" in req.body){
    doc.description = description;
  }
  if ("category" in req.body){
    doc.category = category;
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

  /*
  for (key in doc){
    if (key=="createdIP")
      console.log(key, doc[key]);
  }
  //doc.push(createdIP: "abc12");
  */
  return doc;

}
