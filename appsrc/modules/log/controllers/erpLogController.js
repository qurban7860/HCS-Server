const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let logDBService = require('../service/logDBService')
this.dbservice = new logDBService();

const { ErpLog } = require('../models');
const { SecurityUser } = require('../../security/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getLog = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(ErpLog, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    if(this.query?.fromDate && this.query?.fromDate) {
      this.query.date =  {
        $gte: new Date(this.query.fromDate),
        $lte: new Date(this.query.toDate)
      };
      this.query.date = {
        $gte: new Date(this.query.date.$gte.toISOString()),
        $lte: new Date(this.query.date.$lte.toISOString())
      };
    }
    
    delete this.query?.fromDate;
    delete this.query?.toDate;

    let response = await this.dbservice.getObjectList(req, ErpLog, this.fields, this.query, this.orderBy, this.populate);
    
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getLogsGraph = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const match = {}
    if(this.query.year) {
      match.date = {$gte: new Date(`${this.query.year}-01-01`) }
    }

    if(mongoose.Types.ObjectId.isValid(this.query.machine)) {
      match.machine =  new mongoose.Types.ObjectId(this.query.machine);
    }
    const graphResults = await ErpLog.aggregate([
      {$match:match},
      { $group: {
        _id: { $dateTrunc: { date: "$date", unit: "quarter" } },
        componentLength: { $sum: "$componentLength" },
        waste: { $sum: "$waste" },
      }},
      { $sort: { "_id": 1 } }
    ]);
    
    return res.json(graphResults);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteLog = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(ErpLog, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {

      if(!mongoose.Types.ObjectId.isValid(req.body.machine) || 
        !mongoose.Types.ObjectId.isValid(req.body.customer)) {
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data machine/customer not found');
      }

      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json({ Log: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.postLogMulti = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      
      if(!mongoose.Types.ObjectId.isValid(req.body.machine) || 
        !mongoose.Types.ObjectId.isValid(req.body.customer)) {
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data machine/customer not found');
      }
      
      const respArr = []
      if(Array.isArray(req.body.csvData) && req.body.csvData.length>0 ) {
        const skipExistingRecords = req.body?.skipExistingRecords && req.body?.skipExistingRecords == 'true' ? true : false;
        let updateExistingRecords = req.body?.updateExistingRecords && req.body?.updateExistingRecords == 'true' ? true : false;
        if(skipExistingRecords) updateExistingRecords = false;

        console.log("skipExistingRecords", skipExistingRecords);
        
        for(const logObj of req.body.csvData) {
          logObj.machine = req.body.machine;
          logObj.customer = req.body.customer;
          logObj.loginUser = req.body.loginUser;

          const fakeReq = { body: logObj};
          let queryString__ = {machine: logObj.machine, date: fakeReq.body.date};
          console.log(queryString__);
          let objectERP = await ErpLog.findOne(queryString__).select('_id').sort({_id: -1}).lean();
          let response = null;
          console.log("1*****", objectERP);          
          console.log("2*****", objectERP);
          console.log(objectERP == null , !skipExistingRecords);
          if(objectERP == null || !skipExistingRecords || updateExistingRecords)
          if(objectERP && updateExistingRecords){
            const result = await this.dbservice.patchObject(ErpLog, objectERP._id, getDocumentFromReq(fakeReq));
            if(fakeReq.body?.loginUser)
              delete fakeReq.body.loginUser;

            response = fakeReq.body;
          }else {
            response = await this.dbservice.postObject(getDocumentFromReq(fakeReq, 'new'));
          }
          respArr.push(response);
        } 
        res.status(StatusCodes.CREATED).json({ Logs: respArr });
      } 
      else {
        res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data');

      }   


    
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


exports.patchLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(ErpLog, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { coilBatchName, ccThickness, ccThicknessUnit, coilLength, coilLengthUnit, operator, frameSet, 
  componentLabel, customer, isActive, isArchived, webWidth, webWidthUnit, componentLength, 
  componentLengthUnit, loginUser, flangeHeight, flangeHeightUnit, profileShape, componentWeight, 
  componentWeightUnit, date, waste, wasteUnit, time, timeUnit, machine, type } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new ErpLog({});
  }

  if ("coilBatchName" in req.body) {
    doc.coilBatchName = coilBatchName;
  }

  if ("ccThickness" in req.body) {
    doc.ccThickness = ccThickness;
  }

  if ("ccThicknessUnit" in req.body) {
    doc.ccThicknessUnit = ccThicknessUnit;
  }

  if ("coilLength" in req.body) {
    doc.coilLength = coilLength;
  }

  if ("coilLengthUnit" in req.body) {
    doc.coilLengthUnit = coilLengthUnit;
  }

  if ("operator" in req.body) {
    doc.operator = operator;
  }

  if ("frameSet" in req.body) {
    doc.frameSet = frameSet;
  }

  if ("componentLabel" in req.body) {
    doc.componentLabel = componentLabel;
  }

  if ("webWidth" in req.body) {
    doc.webWidth = webWidth;
  }

  if ("webWidthUnit" in req.body) {
    doc.webWidthUnit = webWidthUnit;
  }

  if ("componentLength" in req.body) {
    doc.componentLength = componentLength;
  }

  if ("componentLengthUnit" in req.body) {
    doc.componentLengthUnit = componentLengthUnit;
  }

  if ("componentWeight" in req.body) {
    doc.componentWeight = componentWeight;
  }

  if ("componentWeightUnit" in req.body) {
    doc.componentWeightUnit = componentWeightUnit;
  }

  if ("flangeHeight" in req.body) {
    doc.flangeHeight = flangeHeight;
  }

  if ("flangeHeightUnit" in req.body) {
    doc.flangeHeightUnit = flangeHeightUnit;
  }

  if ("profileShape" in req.body) {
    doc.profileShape = profileShape;
  }

  if ("waste" in req.body) {
    doc.waste = waste;
  }

  if ("wasteUnit" in req.body) {
    doc.wasteUnit = wasteUnit;
  }

  if ("time" in req.body) {
    doc.time = time;
  }

  if ("timeUnit" in req.body) {
    doc.timeUnit = timeUnit;
  }

  if ("date" in req.body) {
    doc.date = date;
  }

  if ("type" in req.body) {
    doc.type = type;
  }

  if ("customer" in req.body) {
    doc.customer = customer;
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if (reqType == "new" && "loginUser" in req.body) {
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