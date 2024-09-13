const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let logDBService = require('../service/logDBService')
this.dbservice = new logDBService();
const { CoilLog, ErpLog, ProductionLog, ToolCountLog, WasteLog } = require('../models');

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
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) {
      return res.status(400).send("Please Provide a valid Log ID!");
    }
    const Model = getModel( req.query?.type );
    delete this.query?.type;
    const response = await this.dbservice.getObjectById(Model, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const Model = getModel( this.query.type );
    delete this.query.type;
    if(this.query?.fromDate && this.query?.fromDate) {
      if(this.query?.isCreatedAt) {
        this.query.createdAt =  {
          $gte: new Date(this.query.fromDate),
          $lte: new Date(this.query.toDate)
        };
        this.query.createdAt = {
          $gte: new Date(this.query.createdAt.$gte.toISOString()),
          $lte: new Date(this.query.createdAt.$lte.toISOString())
        };
      } else {
        this.query.date =  {
          $gte: new Date(this.query.fromDate),
          $lte: new Date(this.query.toDate)
        };
        this.query.date = {
          $gte: new Date(this.query.date.$gte.toISOString()),
          $lte: new Date(this.query.date.$lte.toISOString())
        }; 
      }
    }
    
    delete this.query?.fromDate;
    delete this.query?.toDate;

    let response = await this.dbservice.getObjectList(req, Model, this.fields, this.query, this.orderBy, this.populate);
    
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getLogsGraph = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const LogModel = getModel( this.query.type );
    delete this.query.type;
    const match = {}
    if( this.query.year ) {
      match.date = {$gte: new Date(`${this.query.year}-01-01`) }
    }

    if( mongoose.Types.ObjectId.isValid(this.query.machine) ) {
      match.machine =  new mongoose.Types.ObjectId(this.query.machine);
    }
    const graphResults = await LogModel.aggregate([
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)");
  }
};

exports.deleteLog = async (req, res, next) => {
  try {
    const logType = req.query.type;
    const Model = getModel( logType );
    const result = await this.dbservice.deleteObject(Model, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.postLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  if (!mongoose.Types.ObjectId.isValid(req.body?.machine) || 
      !mongoose.Types.ObjectId.isValid(req.body?.customer)) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data: machine/customer not found');
  }

  if (!Array.isArray(req.body?.logs) || req.body?.logs?.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data: Data is missing or empty');
  }

  try {
    const { logs, machine, customer, version, loginUser, skip, type } = req.body;
    const Model = getModel( type );
    let { update } = req.body;
    const logsToInsert = []; 
    const logsToUpdate = [];

    if (skip)
      update = false;

    await Promise.all( logs?.map(async (logObj) => {
        logObj.machine = machine;
        logObj.customer = customer;
        logObj.loginUser = loginUser;
        logObj.type = type;
        logObj.version = version;
        const fakeReq = { body: logObj };
        const query = { machine: logObj.machine, date: fakeReq.body.date };
        const existingLog = await Model.findOne(query).select('_id').lean();

        if (existingLog && skip) {
          return;
        }

        if (existingLog && update) {
          const updatedLog = getDocumentFromReq(fakeReq);
          logsToUpdate.push({ _id: existingLog._id, update: updatedLog });
        } else if (!existingLog) {
          const newLog = getDocumentFromReq(fakeReq, 'new');
          logsToInsert.push(newLog);
        }
    }));

    if (logsToInsert.length > 0) {
      await Model.insertMany(logsToInsert);
    }

    if (logsToUpdate.length > 0) {
      await Promise.all(logsToUpdate.map((log) =>
        this.dbservice.patchObject(Model, log._id, log.update)
      ));
    }

    res.status(StatusCodes.CREATED).json({ message: 'Logs processed successfully' });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};



exports.patchLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const logType = req.query.type;
      const Model = getModel( logType );
      const result = await this.dbservice.patchObject(Model, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getModel( logType ){ 

  if( !logType?.trim() ){
    throw new Error("Log type is not defined!");
  }

  let Model
  if(logType?.toUpperCase() === 'COIL' ){
    Model = CoilLog;
  } else if( logType.toUpperCase() === 'ERP' ){
    Model = ErpLog;
  } else if( logType.toUpperCase() === 'PRODUCTION' ){
    Model = ProductionLog;
  } else if( logType.toUpperCase() === 'TOOLCOUNT' ){
    Model = ToolCountLog;
  } else if( logType.toUpperCase() === 'WASTE' ){
    Model = WasteLog;
  }

  if (!Model) {
    throw new Error(`No model found for log type: ${logType}`);
  }

  return Model;
}

function getDocumentFromReq(req, reqType) {
  const { type, loginUser, ...restBody } = req.body;
  const Model = getModel( type );
  let doc = {};

  if (reqType && reqType === "new") {
    doc = new Model({});
  }

  Object.keys(restBody).forEach((key) => {
    if (restBody[key] !== undefined) {
      doc[key] = restBody[key];
    }
  });

  if (reqType === "new" && loginUser) {
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
    doc.createdAt = new Date();
    doc.updatedAt = new Date();
  } else if (loginUser) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
    doc.updatedAt = new Date();
  }

  return doc;
}

exports.getDocumentFromReq = getDocumentFromReq;