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

const { ProductCategory, ProductModel, ProductDrawing } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };    
this.populate = [
  {path: 'document', select: 'displayName'},
  {path: 'documentCategory', select: 'name'},
  {path: 'documentType', select: 'name'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

exports.getProductDrawing = async (req, res, next) => {
  let response = await this.dbservice.getObjectById(ProductDrawing, this.fields, req.params.id, this.populate);
  if (response) {
    res.json(response);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
};

exports.getProductDrawings = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  
  this.dbservice.getObjectList(ProductDrawing, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductDrawing = async (req, res, next) => {
  this.dbservice.deleteObject(ProductDrawing, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductDrawing = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let documentId = req.body.documentId;
    let documentCategory = req.body.documentCategory;
    let documentType = req.body.documentType;
    let machine = req.body.machine

    let alreadyExists = await ProductDrawing.findOne( { machine, document:documentId, documentCategory, documentType } );
    if(!alreadyExists) {
      this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            error._message
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
            );
        } else {
          res.status(StatusCodes.CREATED).json({ MachineCategory: response });
        }
      }
    }
    else {
      res.status(StatusCodes.BAD_REQUEST).send('Already Exists');

    }
  }
};

exports.patchProductDrawing = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(ProductDrawing, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { machine, documentCategory, documentType, documentId, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductDrawing({});
  }

  if ("machine" in req.body){
    doc.machine = machine;
  }
  if ("documentCategory" in req.body){
    doc.documentCategory = documentCategory;
  }
  if ("documentType" in req.body){
    doc.documentType = documentType;
  }
  if ("documentId" in req.body){
    doc.document = documentId;
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
