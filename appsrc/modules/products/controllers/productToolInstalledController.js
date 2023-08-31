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

const { ProductToolInstalled } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'},
  {path: 'tool', select: 'name'}
];

let validToolTypeArr = ['GENERIC TOOL','SINGLE TOOL','COMPOSIT TOOL'];
let validEngageOnCondition = ['PASS','NO CONDITION','PROXIMITY SENSOR'];
let validEngageOffCondition = ['PASS','TIMER','PROXIMITY SENSOR','PRESSURE TARGET','DISTANCE SENSOR','PRESSURE TRIGGERS TIMER'];
let validMovingPunchCondition = ['NO PUNCH','PUNCH WHILE JOGGING','PUNCH WHILE RUNNING'];


exports.getProductToolInstalled = async (req, res, next) => {
  this.dbservice.getObjectById(ProductToolInstalled, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      let toolsInstalled = JSON.parse(JSON.stringify(response));
      let index = 0;
      if(toolsInstalled &&  Array.isArray(toolsInstalled.compositeToolConfig)) {
        for(let compositeConfig of toolsInstalled.compositeToolConfig) {

          if(compositeConfig.engageInstruction) {
            compositeConfig.engageInstruction = await ProductToolInstalled.findById(compositeConfig.engageInstruction).populate('tool');
          }

          if(compositeConfig.disengageInstruction) {
            compositeConfig.disengageInstruction = await ProductToolInstalled.findById(compositeConfig.disengageInstruction).populate('tool');
          }

          toolsInstalled.compositeToolConfig[index] = compositeConfig;
          index++;
        }
      }
      res.json(toolsInstalled);
    }
  }

};

exports.getProductToolInstalledList = async (req, res, next) => {
  this.machineId = req.params.machineId;
  this.query = req.query != "undefined" ? req.query : {};  
  this.query.machine = this.machineId;
  this.dbservice.getObjectList(ProductToolInstalled, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      response = JSON.parse(JSON.stringify(response));
      let i = 0;
      for(let toolsInstalled of response) {

        let index = 0;
        if(toolsInstalled &&  Array.isArray(toolsInstalled.compositeToolConfig)) {
          for(let compositeConfig of toolsInstalled.compositeToolConfig) {

            if(compositeConfig.engageInstruction) {
              compositeConfig.engageInstruction = await ProductToolInstalled.findById(compositeConfig.engageInstruction).populate('tool');
            }

            if(compositeConfig.disengageInstruction) {
              compositeConfig.disengageInstruction = await ProductToolInstalled.findById(compositeConfig.disengageInstruction).populate('tool');
            }
            
            toolsInstalled.compositeToolConfig[index] = compositeConfig;
            index++;
          }
        }
        response[i] = toolsInstalled;
        i++;
      }
      res.json(response);
    }
  }
};

exports.searchProductToolInstalled = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  

  this.dbservice.getObjectList(ProductToolInstalled, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      response = JSON.parse(JSON.stringify(response));
      let i = 0;
      for(let toolsInstalled of response) {

        let index = 0;
        if(toolsInstalled &&  Array.isArray(toolsInstalled.compositeToolConfig)) {
          for(let compositeConfig of toolsInstalled.compositeToolConfig) {

            if(compositeConfig.engageInstruction) {
              compositeConfig.engageInstruction = await ProductToolInstalled.findById(compositeConfig.engageInstruction).populate('tool');
            }

            if(compositeConfig.disengageInstruction) {
              compositeConfig.disengageInstruction = await ProductToolInstalled.findById(compositeConfig.disengageInstruction).populate('tool');
            }
            
            toolsInstalled.compositeToolConfig[index] = compositeConfig;
            index++;
          }
        }
        response[i] = toolsInstalled;
        i++;
      }
      res.json(response);
    }
  }
};

exports.deleteProductToolInstalled = async (req, res, next) => {
  this.dbservice.deleteObject(ProductToolInstalled, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductToolInstalled = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    
    if(!req.body.toolType || !validToolTypeArr.includes(req.body.toolType))
      return res.status(StatusCodes.BAD_REQUEST).send({message:"Tool Type is not valid"});


    if(req.body.singleToolConfig && !validEngageOnCondition.includes(req.body.singleToolConfig.engageOnCondition) ) 
      req.body.singleToolConfig.engageOnCondition = 'NO CONDITION';

    if(req.body.singleToolConfig && !validEngageOffCondition.includes(req.body.singleToolConfig.engageOffCondition) ) 
      req.body.singleToolConfig.engageOffCondition = 'PASS';

    if(req.body.singleToolConfig && !validMovingPunchCondition.includes(req.body.singleToolConfig.movingPunchCondition) ) 
      req.body.singleToolConfig.movingPunchCondition = 'NO PUNCH';

    let finalCompositeToolConfig = [];
    if(Array.isArray(req.body.compositeToolConfig) && req.body.compositeToolConfig.length>0) {
      for(let compositeToolConfig of req.body.compositeToolConfig) {

        if(mongoose.Types.ObjectId.isValid(compositeToolConfig.engageInstruction) ||
          mongoose.Types.ObjectId.isValid(compositeToolConfig.disengageInstruction)) {
          finalCompositeToolConfig.push(compositeToolConfig);
        }
      }
    }

    req.body.compositeToolConfig = finalCompositeToolConfig;

    if(req.body.toolType!='SINGLE TOOL')
      req.body.singleToolConfig = {};      

    if(req.body.toolType!='COMPOSIT TOOL')
      req.body.compositeToolConfig = [];

    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ MachineToolInstalled: response });
      }
    }
  }
};

exports.patchProductToolInstalled = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if(!req.body.toolType || !validToolTypeArr.includes(req.body.toolType))
      return res.status(StatusCodes.BAD_REQUEST).send({message:"Tool Type is not valid"});

    if(req.body.singleToolConfig && !validEngageOnCondition.includes(req.body.singleToolConfig.engageOnCondition) ) 
      req.body.singleToolConfig.engageOnCondition = 'NO CONDITION';

    if(req.body.singleToolConfig && !validEngageOffCondition.includes(req.body.singleToolConfig.engageOffCondition) ) 
      req.body.singleToolConfig.engageOffCondition = 'PASS';

    if(req.body.singleToolConfig && !validMovingPunchCondition.includes(req.body.singleToolConfig.movingPunchCondition) ) 
      req.body.singleToolConfig.movingPunchCondition = 'NO PUNCH';

    let finalCompositeToolConfig = [];
    
    if(Array.isArray(req.body.compositeToolConfig) && req.body.compositeToolConfig.length>0) {
      for(let compositeToolConfig of req.body.compositeToolConfig) {
        if(mongoose.Types.ObjectId.isValid(compositeToolConfig.engageInstruction) ||
          mongoose.Types.ObjectId.isValid(compositeToolConfig.disengageInstruction)) {
          finalCompositeToolConfig.push(compositeToolConfig);
        }
      }
    }

    req.body.compositeToolConfig = finalCompositeToolConfig;

    if(req.body.toolType!='SINGLE TOOL')
      req.body.singleToolConfig = {};      

    if(req.body.toolType!='COMPOSIT TOOL')
      req.body.compositeToolConfig = [];

    this.dbservice.patchObject(ProductToolInstalled, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};


function getDocumentFromReq(req, reqType){
  
  const { tool, offset, isApplyWaste, wasteTriggerDistance, isApplyCrimp, crimpTriggerDistance, 
  singleToolConfig, compositeToolConfig, isBackToBackPunch, isManualSelect, isAssign, operations, 
  toolType, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductToolInstalled({});
  }

  if ("machine" in req.body){
    doc.machine = req.body.machine;
  }else{
    doc.machine = req.params.machineId;
  }

  if ("tool" in req.body){
    doc.tool = tool;
  }
  
  if ("offset" in req.body){
    doc.offset = offset;
  }

  if ("isApplyWaste" in req.body){
    doc.isApplyWaste = isApplyWaste;
  }

  if ("wasteTriggerDistance" in req.body){
    doc.wasteTriggerDistance = wasteTriggerDistance;
  }

  if ("isApplyCrimp" in req.body){
    doc.isApplyCrimp = isApplyCrimp;
  }

  if ("crimpTriggerDistance" in req.body){
    doc.crimpTriggerDistance = crimpTriggerDistance;
  }

  if ("isBackToBackPunch" in req.body){
    doc.isBackToBackPunch = isBackToBackPunch;
  }

  if ("isManualSelect" in req.body){
    doc.isManualSelect = isManualSelect;
  }

  if ("isAssign" in req.body){
    doc.isAssign = isAssign;
  }

  if ("operations" in req.body){
    doc.operations = operations;
  }

  if ("toolType" in req.body){
    doc.toolType = toolType;
  }

  if ("isActive" in req.body){
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }
  if("singleToolConfig" in req.body && typeof req.body.singleToolConfig=='object' ){
    doc.singleToolConfig = {};
    if("engageSolenoidLocation" in singleToolConfig){
      doc.singleToolConfig.engageSolenoidLocation = singleToolConfig.engageSolenoidLocation;
    }
    if("returnSolenoidLocation" in singleToolConfig){
      doc.singleToolConfig.returnSolenoidLocation = singleToolConfig.returnSolenoidLocation;
    }
    if("engageOnCondition" in singleToolConfig){
      doc.singleToolConfig.engageOnCondition = singleToolConfig.engageOnCondition;
    }
    if("engageOffCondition" in singleToolConfig){
      doc.singleToolConfig.engageOffCondition = singleToolConfig.engageOffCondition;
    }
    if("timeOut" in singleToolConfig){
      doc.singleToolConfig.timeOut = singleToolConfig.timeOut;
    }
    if("engagingDuration" in singleToolConfig){
      doc.singleToolConfig.engagingDuration = singleToolConfig.engagingDuration;
    }
    if("returningDuration" in singleToolConfig){
      doc.singleToolConfig.returningDuration = singleToolConfig.returningDuration;
    }
    if("twoWayCheckDelayTime" in singleToolConfig){
      doc.singleToolConfig.twoWayCheckDelayTime = singleToolConfig.twoWayCheckDelayTime;
    }
    if("homeProximitySensorLocation" in singleToolConfig){
      doc.singleToolConfig.homeProximitySensorLocation = singleToolConfig.homeProximitySensorLocation;
    }
    if("engagedProximitySensorLocation" in singleToolConfig){
      doc.singleToolConfig.engagedProximitySensorLocation = singleToolConfig.engagedProximitySensorLocation;
    }
    if("pressureTarget" in singleToolConfig){
      doc.singleToolConfig.pressureTarget = singleToolConfig.pressureTarget;
    }
    if("distanceSensorLocation" in singleToolConfig){
      doc.singleToolConfig.distanceSensorLocation = singleToolConfig.distanceSensorLocation;
    }
    if("distanceSensorTarget" in singleToolConfig){
      doc.singleToolConfig.distanceSensorTarget = singleToolConfig.distanceSensorTarget;
    }
    if("isHasTwoWayCheck" in singleToolConfig){
      doc.singleToolConfig.isHasTwoWayCheck = singleToolConfig.isHasTwoWayCheck;
    }
    if("isEngagingHasEnable" in singleToolConfig){
      doc.singleToolConfig.isEngagingHasEnable = singleToolConfig.isEngagingHasEnable;
    }
    if("isReturningHasEnable" in singleToolConfig){
      doc.singleToolConfig.isReturningHasEnable = singleToolConfig.isReturningHasEnable;
    }
    if("movingPunchCondition" in singleToolConfig){
      doc.singleToolConfig.movingPunchCondition = singleToolConfig.movingPunchCondition;
    }
  }

  doc.compositeToolConfig = [];
  
  if("compositeToolConfig" in req.body && 
    Array.isArray(req.body.compositeToolConfig) && 
    req.body.compositeToolConfig.length>0){
    doc.compositeToolConfig = req.body.compositeToolConfig;
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
