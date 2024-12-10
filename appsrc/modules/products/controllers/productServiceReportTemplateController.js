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
const { securityNotificationController } = require('../../security/controllers')
this.dbservice = new productDBService();

const { ProductServiceReportTemplate, ProductCheckItem, ProductModel, Product } = require('../models');

const { SecurityUser, SecurityRole } = require('../../security/models');


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


exports.getProductServiceReportTemplate = async (req, res, next) => {
  let populateValues = [
    {path: 'machineCategory', select: 'name'},
    {path: 'machineModel', select: 'name category'},
    
    {path: 'category', select: 'name'},
    {path: 'createdBy', select: 'name'},
    {path: 'updatedBy', select: 'name'},
    {path: 'submittedInfo.submittedBy', select: 'name'}
  ];
  this.dbservice.getObjectById(ProductServiceReportTemplate, this.fields, req.params.id, populateValues, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      try{
        response = JSON.parse(JSON.stringify(response));
        if(response) {
          const serviceReportTemplate = JSON.parse(JSON.stringify(response));
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

          
          if(Array.isArray(response.approvals) && response.approvals.length>0 ) {
            let serviceReportTemplateVerifications = [];
    
            for(let verification of response.approvals) {

              let user = await SecurityUser.findOne({ _id: verification.approvedBy}).select('name');
    
              if(user) {
                verification.approvedBy = user;
                serviceReportTemplateVerifications.push(verification);
              }
    
            }
            response.approvals = serviceReportTemplateVerifications;
          }
          return res.json(response);
        } else {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        }
      }catch(e) {
        console.log("Exception:", e);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }

};

exports.getProductServiceReportTemplates = async (req, res, next) => {

  this.query = req.query != "undefined" ? req.query : {};  
  this.orderBy = { reportTitle: 1 };

  if(this.query.isArchived=='true'){
    this.query.isArchived = true
  }
  else {
    this.query.isArchived = false;
  }

  // if(this.query.isActive=='false'){
  //   this.query.isActive = false
  // }
  // else {
  //   this.query.isActive = true;
  // }

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

  let serviceReportTemplates = await this.dbservice.getObjectList(req, ProductServiceReportTemplate, this.fields, this.query, this.orderBy, this.populate);

  try{
    serviceReportTemplates = JSON.parse(JSON.stringify(serviceReportTemplates));
    return res.status(StatusCodes.OK).json(serviceReportTemplates);

  }catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
  
};

exports.deleteProductServiceReportTemplate = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceReportTemplate, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductServiceReportTemplate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

  if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);

  if(req.body.originalTemplate) {
    let whereClause  = {
      $or: [{
        _id: req.body.originalTemplate
      }, {
        originalTemplate: req.body.originalTemplate
      }], status: "APPROVED" 
    };

    let proSerObj = await ProductServiceReportTemplate.findOne(whereClause).sort({_id: -1}).limit(1) ;
    if(proSerObj)
      req.body.docVersionNo = proSerObj.docVersionNo + 1;
    else 
      delete req.body.originalTemplate
  }

  if(req.body.status == "SUBMITTED") {
    req.body.submittedInfo = {
      submittedBy: req.body.loginUser.userId,
      submittedDate: new Date()
    }
  }

  this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        error._message
      );
    } else {

      if(req.body.status == "SUBMITTED") {
        let type_ = "SERVICE-TEMPLATE";
        const roles = await SecurityRole.find({roleType:'SuperAdmin'}).select('_id');
        if(roles) {
          const users = await SecurityUser.find({roles:{$in:roles.map((r)=>r._id)}}).select('_id');
        
          if(Array.isArray(users) && users.length>0) {
            const userIds = users.map((u)=>u._id);
            await securityNotificationController.createNotification(
              `Service Report Template with title ${req.body.reportTitle} has been submitted. Please Review.`,
              req.body.loginUser.userId, 
              userIds,
              type_,
              {
                _id: response._id, 
                reportTitle: response.reportTitle,
                reportType: response.reportType,
                status: response.status,
                docVersionNo: response.docVersionNo
              },
              "Service Template Submitted"
            );
          }
        }   
      }

      if(response && response.machineModel) {
        let machineModel = await ProductModel.findOne({_id:response.machineModel,isActive:true,isArchived:false}).populate('category');
        response = JSON.parse(JSON.stringify(response));
        if(machineModel)
          response.machineModel = machineModel;
      }
      res.status(StatusCodes.CREATED).json({ ServiceReportTemplate: response });
    }
  }
}
};

exports.patchProductServiceReportTemplate = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    
    if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);
  
  
    if(req.body.isArchived=='true' || req.body.isArchived===true){
      req.body = {isArchived: true};
    } else {
      let productServiceReportTemplate = await ProductServiceReportTemplate.findById(req.params.id); 
      if(productServiceReportTemplate.status == "DRAFT" && req.body.status == "SUBMITTED") {

        req.body.submittedInfo = {
          submittedBy: req.body.loginUser.userId,
          submittedDate: new Date()
        }

        let type_ = "SERVICE-TEMPLATE";
        const roles = await SecurityRole.find({roleType:'SuperAdmin'}).select('_id');
        if(roles) {
          const users = await SecurityUser.find({roles:{$in:roles.map((r)=>r._id)}}).select('_id');
          if(Array.isArray(users) && users.length>0) {
            const userIds = users.map((u)=>u._id);
            await securityNotificationController.createNotification(
              `Service Report Template with title ${req.body.reportTitle} has been submitted. Please Review.`,
              req.body.loginUser.userId, 
              userIds,
              type_,
              {
                _id:  productServiceReportTemplate._id, 
                reportTitle: productServiceReportTemplate.reportTitle,
                reportType: productServiceReportTemplate.reportType,
                status: req.body.status,
                docVersionNo: productServiceReportTemplate.docVersionNo
              },
              "Service Template Submitted"
            );
          }
        }        

      } else if(productServiceReportTemplate.status == "SUBMITTED" && req.body.status == "DRAFT") {
        req.body.submittedInfo = {};
      }
      
      if(req.body.isVerified){ 
        if(!productServiceReportTemplate) {
          return res.status(StatusCodes.BAD_REQUEST).send("Product Service Report Template Not Found");
        }
        
        if(!Array.isArray(productServiceReportTemplate.approvals))
          productServiceReportTemplate.approvals = [];

        for(let verif of productServiceReportTemplate.approvals) {
          if(verif.approvedBy == req.body.loginUser.userId)
            return res.status(StatusCodes.BAD_REQUEST).send("Already Approved!");
        }

        productServiceReportTemplate.approvals.push({
          approvedBy: req.body.loginUser.userId,
          approvedDate: new Date(),
          approvedFrom: req.body.loginUser.userIP
        })

        if(productServiceReportTemplate && productServiceReportTemplate.status === 'SUBMITTED' && productServiceReportTemplate.approvals.length >= productServiceReportTemplate.noOfApprovalsRequired) {
          productServiceReportTemplate.status = 'APPROVED';

          if(productServiceReportTemplate.originalTemplate) {
            let whereClause  = {
              $or: [{
                _id: productServiceReportTemplate.originalTemplate
              }, {
                originalTemplate: productServiceReportTemplate.originalTemplate
              }], status: "APPROVED" 
            };
        
            await ProductServiceReportTemplate.updateMany(whereClause, { isActive: false }, { new: true });
            

            let proSerObj = await ProductServiceReportTemplate.findOne(whereClause).sort({_id: -1}).limit(1);
            if(proSerObj)
              productServiceReportTemplate.docVersionNo = proSerObj.docVersionNo + 1;
          }
        }

        productServiceReportTemplate = await productServiceReportTemplate.save();
        return res.status(StatusCodes.ACCEPTED).json(productServiceReportTemplate);
      }


      if(productServiceReportTemplate && productServiceReportTemplate.status === 'APPROVED') {
        return res.status(StatusCodes.BAD_REQUEST).send("Product Service Report Template is in APPROVED state!");
      }

      if(productServiceReportTemplate && req.body.status === 'APPROVED' && productServiceReportTemplate.status != 'SUBMITTED') {
        return res.status(StatusCodes.BAD_REQUEST).send(`Status should be SUBMITTED to APPROVED Template`);
      }
      
      if(productServiceReportTemplate && req.body.status === 'APPROVED' && productServiceReportTemplate.noOfApprovalsRequired > productServiceReportTemplate.approvals.length) {
        return res.status(StatusCodes.BAD_REQUEST).send(`${productServiceReportTemplate.noOfApprovalsRequired} Verification${productServiceReportTemplate.noOfApprovalsRequired == 1 ? '':'s'} required to approve Template! `);
      }

    }
     
    this.dbservice.patchObject(ProductServiceReportTemplate, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        let machineServiceReportTemplate = await ProductServiceReportTemplate.findOne({_id:req.params.id,isActive:true,isArchived:false}).populate('category');
        if(res && res.machineModel) {
          let machineModel = await ProductModel.findOne({_id:machineServiceReportTemplate.machineModel,isActive:true,isArchived:false}).populate('category');
          machineServiceReportTemplate = JSON.parse(JSON.stringify(machineServiceReportTemplate));
          if(machineModel)
            machineServiceReportTemplate.machineModel = machineModel;
        }
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, machineServiceReportTemplate));
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
  const { machineCategory, reportType, machineModel, status, submittedInfo, parentTemplate, originalTemplate, reportTitle, docVersionNo, textBeforeCheckItems, paramsTitle, params, 
    checkItemLists, enableAdditionalParams, additionalParamsTitle, additionalParams, 
    enableMachineMetreage, machineMetreageTitle, machineMetreageParams, enablePunchCycles, punchCyclesTitle, 
    punchCyclesParams, textAfterCheckItems, isOperatorSignatureRequired, enableNote, enableMaintenanceRecommendations, 
    enableSuggestedSpares, header, footer, noOfApprovalsRequired, approvals, loginUser, isActive, isArchived
} = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceReportTemplate({});
  }

  if ("reportType" in req.body){
    doc.reportType = reportType;
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

  if ("submittedInfo" in req.body){
    doc.submittedInfo = submittedInfo;
  }
  
  if ("parentTemplate" in req.body){
    doc.parentTemplate = parentTemplate;
  }

  if ("originalTemplate" in req.body){
    doc.originalTemplate= originalTemplate;
  }

  if ("reportTitle" in req.body){
    doc.reportTitle = reportTitle;
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
  
  if ("noOfApprovalsRequired" in req.body){
    doc.noOfApprovalsRequired = noOfApprovalsRequired;
  }
  if ("approvals" in req.body){
    doc.approvals = approvals;


    if (reqType && reqType === "new") {
      for (let i = 0; i < doc.approvals.length; i++) {
          doc.approvals[i].approvedFrom = loginUser.userIP;
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
