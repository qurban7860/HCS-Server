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

const { ProductTechParam } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'},
  {path: 'category', select: '_id name description'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductTechParam = async (req, res, next) => {
  this.dbservice.getObjectById(ProductTechParam, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductTechParams = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {}; 
  this.orderBy = { name: 1 }; 
  this.dbservice.getObjectList(ProductTechParam, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductTechParam = async (req, res, next) => {
  this.dbservice.deleteObject(ProductTechParam, req.params.id, res, callbackFunc);
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

exports.postProductTechParam = async (req, res, next) => {
  var _this = this;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let queryString  = { $or: [
      { name: req.body.name },
      { code: req.body.code }
    ]};
    this.dbservice.getObject(ProductTechParam, queryString, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        if(_.isEmpty(response)){
          _this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
          function callbackFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                error._message
                //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
              );
            } else {
              res.status(StatusCodes.CREATED).json({ MachineTechParam: response });
            }
          }    
        } else{
          if(req.body.name == response.name){
            res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Name must be unique!"));          
          } 
          if(req.body.code == response.code){
            res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Code must be unique!"));          
          }        
        }
      }
    }
  }
};

exports.patchProductTechParam = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;

  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let queryString  = { $or: [
      { _id: req.params.id },
      { name: req.body.name },
      { code: req.body.code }
    ]};
    this.dbservice.getObject(ProductTechParam, queryString, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        if(!_.isEmpty(response)){
          _this.dbservice.patchObject(ProductTechParam, req.params.id, getDocumentFromReq(req), callbackFunc);
          function callbackFunc(error, result) {
            if (error) {
              logger.error(new Error(error));
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                error._message
                //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
              );
            } else {
              res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, response));

              // if(req.body.name == response.name){
              //   res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Name must be unique!"));          
              // } 
              // if(req.body.code == response.code){
              //   res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, "Code must be unique!"));          
              // }
            }
          }      
        }
        else {
          res.status(StatusCodes.NOT_FOUND).send(rtnMsg.recordCustomMessage(StatusCodes.NOT_FOUND, "Record Not found !"));
        }
      }
    }
  }
};


function getDocumentFromReq(req, reqType){
  const { name, code, description, category, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductTechParam({});
  }

  if ("name" in req.body){
    doc.name = name;
  }
  if ("code" in req.body){
    doc.code = code;
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

  //console.log("doc in http req: ", doc);
  return doc;

}
