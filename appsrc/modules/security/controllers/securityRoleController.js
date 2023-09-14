const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();
const _ = require('lodash');
const { SecurityRole, SecurityUser } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

this.populateList = [
  {path: '', select: ''}
];


exports.getSecurityRole = async (req, res, next) => {
  let response = await this.dbservice.getObjectById(SecurityRole, this.fields, req.params.id, this.populate);
  if (response) {
    response = JSON.parse(JSON.stringify(response))
    let querySecurityUser = { roles : req.params.id, isArchived:false, isActive:true };
    let fieldsSecurityUser = { name:1, login:1, email:1 }
    const securityUsers = await this.dbservice.getObjectList(SecurityUser, fieldsSecurityUser, querySecurityUser, {}, []);
    response.securityUsers = securityUsers;
    res.json(response);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
};

exports.getSecurityRoles = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.dbservice.getObjectList(SecurityRole, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSecurityRole = async (req, res, next) => {
  await this.dbservice.deleteObject(SecurityRole, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      if (error.statusCode) {
        res.status(error.statusCode).send(getReasonPhrase(error.statusCode));
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postSecurityRole = async (req, res, next) => {
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
        res.status(StatusCodes.CREATED).json({ SecurityRole: response });
      }
    }
  }
};

exports.patchSecurityRole = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchSecurityRole');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if("isArchived" in req.body){
      let existingRole = await this.dbservice.getObjectById(SecurityRole, this.fields, req.params.id, this.populate); 
      if(!(_.isEmpty(existingRole))) {
        if(existingRole.disableDelete){
          return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, "Selected role cannot be deleted!", true));
        } else{
          let queryString = { roles: req.params.id };
          let existingRoleInUse = await this.dbservice.getObject(SecurityUser, queryString, this.populate);
          if(existingRoleInUse){
            return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, "Roles assigned to user(s) cannot be deleted!", true));
          }
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
      }
    }
    
    this.dbservice.patchObject(SecurityRole, req.params.id, getDocumentFromReq(req), callbackFunc);
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

exports.searchRoles = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    this.dbservice.getObjectList(SecurityRole, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    
    function callbackFunc(error, roles) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {

        if(searchName) {
          let filteredRoles = [];
          
          for(let role of roles) {
            let name = role.name.toLowerCase();
            console.log(name,searchName,name.search(searchName.toLowerCase()));
            if(name.search(searchName.toLowerCase())>-1) {
              filteredRoles.push(role);
            }
          }

          roles = filteredRoles;

        } 
        
        return res.status(StatusCodes.OK).json(roles);
      }
    }

  }
};

function getDocumentFromReq(req, reqType){
  const { name, description, allModules, allWriteAccess, disableDelete,
        roleType, modules, loginUser, isActive, isArchived} = req.body;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new SecurityRole({});
  }
  if ("name" in req.body){
    doc.name = name;
  }
  if ("description" in req.body){
    doc.description = description;
  }
  if ("roleType" in req.body){
    doc.roleType = roleType;
  }
  if ("allModules" in req.body){
    doc.allModules = allModules;
  }

  if ("allWriteAccess" in req.body){
    doc.allWriteAccess = allWriteAccess;
  }

  if ("disableDelete" in req.body){
    doc.disableDelete = disableDelete;
  }

  if ("modules" in req.body){
    doc.modules = modules;
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