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

const { ProductServiceRecordsConfig, ProductCheckItem, ProductModel, Product } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'machineCategory', select: 'name'},
  {path: 'machineModel', select: 'name category'},
  
  {path: 'category', select: 'name'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductServiceRecordsConfig = async (req, res, next) => {
  this.dbservice.getObjectById(ProductServiceRecordsConfig, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      try{
        response = JSON.parse(JSON.stringify(response));
        if(response) {
          let index = 0;
          for(let checkParam of response.checkItemLists) {
            if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
              let indexP = 0;
              let paramLists_ = [];

              for(let paramListId of checkParam.checkItems) {
                let checkItem__ = await ProductCheckItem.findOne({_id:paramListId,isActive:true,isArchived:false}).populate('category');
                
                if(checkItem__) {
                  response.checkItemLists[index].checkItems[indexP] = checkItem__;
                  paramLists_.push(checkItem__);
                }
                
                indexP++;
              }
              response.checkItemLists[index].checkItems = paramLists_;
            }
            index++;
          }
        }
        return res.json(response);

      }catch(e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }

};

exports.getProductServiceRecordsConfigs = async (req, res, next) => {

  this.query = req.query != "undefined" ? req.query : {};  
  this.orderBy = { docTitle: 1 };

  if(this.query.isArchived=='true'){
    this.query.isArchived = true
  }
  else {
    this.query.isArchived = false;
  }

  if(this.query.isActive=='false'){
    this.query.isActive = false
  }
  else {
    this.query.isActive = true;
  }

  if(req.params.machineId) {
    let machine = await Product.findOne({_id:req.params.machineId,isActive:true,isArchived:false}).populate('machineModel');
    if(machine && machine.machineModel) {
      
      this.query['$or'] = [
        { machineModel : machine.machineModel.id },
        { machineModel : {$exists :false } },
        { machineModel : null },
        { category : machine.machineModel.category },
        { category : {$exists :false } },
        { category : null },
      ];
       
    }
  }

  let serviceRecordConfigs = await this.dbservice.getObjectList(ProductServiceRecordsConfig, this.fields, this.query, this.orderBy, this.populate);

  try{
    serviceRecordConfigs = JSON.parse(JSON.stringify(serviceRecordConfigs));
    
    // let i = 0;


    // if(Array.isArray(serviceRecordConfigs) && serviceRecordConfigs.length>0) {

    //   for(let serviceRecordConfig of serviceRecordConfigs) {

    //     let index = 0;
    //     for(let checkParam of serviceRecordConfig.checkItemLists) {

    //       if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
    //         let indexP = 0;
    //         let paramLists_ = [];
    //         for(let paramListId of checkParam.checkItems) {
    //           let checkItem__ = await ProductCheckItem.findOne({_id:paramListId,isActive:true,isArchived:false}).populate('category');

    //           if(checkItem__) {
    //             serviceRecordConfigs[i].checkItemLists[index].checkItems[indexP] = checkItem__;
    //             paramLists_.push(checkItem__);
    //           }
    //           indexP++;
    //         }

    //         serviceRecordConfigs[i].checkItemLists[index].checkItems = paramLists_;

    //       } 
          
    //       index++;
    //     }
    //     i++;
    //   }
    // }
    return res.status(StatusCodes.OK).json(serviceRecordConfigs);

  }catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
  
};

exports.deleteProductServiceRecordsConfig = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceRecordsConfig, req.params.id, res, callbackFunc);
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

exports.postProductServiceRecordsConfig = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

  if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);

  this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        error._message
      );
    } else {
      if(response && response.machineModel) {
        let machineModel = await ProductModel.findOne({_id:response.machineModel,isActive:true,isArchived:false}).populate('category');
        response = JSON.parse(JSON.stringify(response));
        if(machineModel)
          response.machineModel = machineModel;
      }
      res.status(StatusCodes.CREATED).json({ ServiceRecordConfig: response });
    }
  }
}
};

exports.patchProductServiceRecordsConfig = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    if(!req.body.loginUser)
      req.body.loginUser = await getToken(req);

    let productServiceRecordsConfig = await ProductServiceRecordsConfig.findById(req.params.id); 
    if(req.body.isVerified){ 

      if(!productServiceRecordsConfig) {
        return res.status(StatusCodes.BAD_REQUEST).json({message:"Product Service Records Config Not Found"});
      }
      
      if(!Array.isArray(productServiceRecordsConfig.verifications))
        productServiceRecordsConfig.verifications = [];

      for(let verif of productServiceRecordsConfig.verifications) {
        if(verif.verifiedBy == req.body.loginUser.userId)
          return res.status(StatusCodes.BAD_REQUEST).json({message:"Already verified"});
      }

      productServiceRecordsConfig.verifications.push({
        verifiedBy: req.body.loginUser.userId,
        verifiedDate: new Date(),
        verifiedFrom: req.body.loginUser.userIP
      })
      productServiceRecordsConfig = await productServiceRecordsConfig.save();
      return res.status(StatusCodes.ACCEPTED).json(productServiceRecordsConfig);
    }


    if(productServiceRecordsConfig && productServiceRecordsConfig.status === 'APPROVED') {
      return res.status(StatusCodes.BAD_REQUEST).json({message:"Product Service Records Config is in APPROVED state!"});
    }

    if(productServiceRecordsConfig && req.body.status === 'APPROVED' && productServiceRecordsConfig.status != 'SUBMITTED') {
      return res.status(StatusCodes.BAD_REQUEST).json({message:`Status should be SUBMITTED to APPROVED configuration`});
    }
    

    if(productServiceRecordsConfig && req.body.status === 'APPROVED' && productServiceRecordsConfig.noOfVerificationsRequired < productServiceRecordsConfig.verifications.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({message:`${productServiceRecordsConfig.noOfVerificationsRequired} Verification${productServiceRecordsConfig.noOfVerificationsRequired == 1 ? '':'s'} required to approve configuartion! `});
    }
    
    this.dbservice.patchObject(ProductServiceRecordsConfig, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        let machineServiceRecordConfig = await ProductServiceRecordsConfig.findOne({_id:req.params.id,isActive:true,isArchived:false}).populate('category');
        if(res && res.machineModel) {
          let machineModel = await ProductModel.findOne({_id:machineServiceRecordConfig.machineModel,isActive:true,isArchived:false}).populate('category');
          machineServiceRecordConfig = JSON.parse(JSON.stringify(machineServiceRecordConfig));
          if(machineModel)
            machineServiceRecordConfig.machineModel = machineModel;
        }
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, machineServiceRecordConfig));
      }
    }
  }
};

async function getToken(req){
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:'';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

function getDocumentFromReq(req, reqType){
  const { machineCategory, recordType, machineModel, status, parentConfig, docTitle, docVersionNo, textBeforeCheckItems, paramsTitle, params, 
    checkItemLists, enableAdditionalParams, additionalParamsTitle, additionalParams, 
    enableMachineMetreage, machineMetreageTitle, machineMetreageParams, enablePunchCycles, punchCyclesTitle, 
    punchCyclesParams, textAfterCheckItems, isOperatorSignatureRequired, enableNote, enableMaintenanceRecommendations, 
    enableSuggestedSpares, header, footer, noOfVerificationsRequired, verifications, loginUser, isActive, isArchived
} = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordsConfig({});
  }

  if ("recordType" in req.body){
    doc.recordType = recordType;
  }

  if ("machineCategory" in req.body){
    doc.machineCategory = machineCategory;
  }


  if ("machineModel" in req.body){
    doc.machineModel = machineModel;
  }
  
  if ("status" in req.body){
    doc.status = status;
  }
  
  if ("parentConfig" in req.body){
    doc.parentConfig = parentConfig;
  }

  if ("docTitle" in req.body){
    doc.docTitle = docTitle;
  }

  if ("docVersionNo" in req.body){
    doc.docVersionNo = docVersionNo;
  }

  

  if ("textBeforeCheckItems" in req.body){
    doc.textBeforeCheckItems = textBeforeCheckItems;
  }

  if ("paramsTitle" in req.body){
    doc.paramsTitle = paramsTitle;
  }

  if ("params" in req.body){
    doc.params = params;
  }

  if ("checkItemLists" in req.body){
    doc.checkItemLists = checkItemLists;
  }

  if ("enableAdditionalParams" in req.body){
    doc.enableAdditionalParams = enableAdditionalParams;
  }

  if ("additionalParamsTitle" in req.body){
    doc.additionalParamsTitle = additionalParamsTitle;
  }
  if ("additionalParams" in req.body){
    doc.additionalParams = additionalParams;
  }
  if ("enableMachineMetreage" in req.body){
    doc.enableMachineMetreage = enableMachineMetreage;
  }
  if ("machineMetreageTitle" in req.body){
    doc.machineMetreageTitle = machineMetreageTitle;
  }
  if ("machineMetreageParams" in req.body){
    doc.machineMetreageParams = machineMetreageParams;
  }
  if ("enablePunchCycles" in req.body){
    doc.enablePunchCycles = enablePunchCycles;
  }
  if ("punchCyclesParams" in req.body){
    doc.punchCyclesParams = punchCyclesParams;
  }
  if ("punchCyclesTitle" in req.body){
    doc.punchCyclesTitle = punchCyclesTitle;
  }
  if ("textAfterCheckItems" in req.body){
    doc.textAfterCheckItems = textAfterCheckItems;
  }
  
  if ("isOperatorSignatureRequired" in req.body){
    doc.isOperatorSignatureRequired = isOperatorSignatureRequired;
  }
  if ("enableNote" in req.body){
    doc.enableNote = enableNote;
  }
  if ("enableMaintenanceRecommendations" in req.body){
    doc.enableMaintenanceRecommendations = enableMaintenanceRecommendations;
  }
  if ("enableSuggestedSpares" in req.body){
    doc.enableSuggestedSpares = enableSuggestedSpares;
  }
  if ("header" in req.body){
    doc.header = header;
  }
  if ("footer" in req.body){
    doc.footer = footer;
  }
  
  if ("noOfVerificationsRequired" in req.body){
    doc.noOfVerificationsRequired = noOfVerificationsRequired;
  }
  if ("verifications" in req.body){
    doc.verifications = verifications;


    if (reqType && reqType === "new") {
      for (let i = 0; i < doc.verifications.length; i++) {
          doc.verifications[i].verifiedFrom = loginUser.userIP;
      }
    }
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
