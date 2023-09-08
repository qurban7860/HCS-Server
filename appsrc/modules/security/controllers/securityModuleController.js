const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');

const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecurityModule } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

exports.getSecurityModule = async (req, res, next) => {
  this.dbservice.getObjectById(SecurityModule, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getSecurityModules = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  // if(this.query){
    this.dbservice.getObjectList(SecurityModule, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  // } else {
  //   var aggregate = [
  //     {
  //       $lookup: {
  //         from: "SecurityModules",
  //         localField: "customer",
  //         foreignField: "_id",
  //         as: "customer"
  //       }
  //     },
  //       {
  //       $match: {
  //         "customer.type" : "SP"
  //       }
  //     }
  //   ];

  //   var params = {};
  //   this.dbservice.getObjectListWithAggregate(SecurityModule, aggregate, params, callbackFunc);
  // }

  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.searchSecurityModules = async (req, res, next) => {
  // this.query = req.query != "undefined" ? req.query : {};
  // if(this.query){
    this.dbservice.getObjectList(SecurityModule, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  // } else {
  //   var aggregate = [
  //     {
  //       $lookup: {
  //         from: "SecurityModules",
  //         localField: "customer",
  //         foreignField: "_id",
  //         as: "customer"
  //       }
  //     },
  //       {
  //       $match: {
  //         "customer.type" : "SP"
  //       }
  //     }
  //   ];

  //   var params = {};
  //   this.dbservice.getObjectListWithAggregate(SecurityModule, aggregate, params, callbackFunc);
  // }

  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSecurityModule = async (req, res, next) => {
  const response = await SecurityModule.findById(req.params.id);
  if(response === null) {
    try {
      console.log("@1");
      const result = await this.dbservice.deleteObject(SecurityModule, req.params.id, res);
      console.log("@2", result);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
      console.log("@3");
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  } else {
    res.status(StatusCodes.CONFLICT).send(rtnMsg.recordDelMessage(StatusCodes.CONFLICT, null));
  }
};


exports.postSecurityModule = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        res.status(StatusCodes.CREATED).json({ securityModule: response });
      }
    }
  }
};

exports.patchSecurityModule = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecurityModule, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};

function getDocumentFromReq(req, reqType){
  const { name, description, accessForNormalUsers, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new SecurityModule({});
  }
  if ("name" in req.body){
    doc.name = name;
  }
  if ("description" in req.body){
    doc.description = description;
  }
  if ("accessForNormalUsers" in req.body){
    doc.accessForNormalUsers = accessForNormalUsers;
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


  return doc;

}


exports.getDocumentFromReq = getDocumentFromReq;