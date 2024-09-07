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

const { ProductionLog } = require('../models');
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
    const response = await this.dbservice.getObjectById(ProductionLog, this.fields, req.params.id, this.populate);
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

    let response = await this.dbservice.getObjectList(req, ProductionLog, this.fields, this.query, this.orderBy, this.populate);
    
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
    const graphResults = await ProductionLog.aggregate([
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
    const result = await this.dbservice.deleteObject(ProductionLog, req.params.id);
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
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data, customer/machine not found!');
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
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  if (!mongoose.Types.ObjectId.isValid(req.body?.machine) || 
      !mongoose.Types.ObjectId.isValid(req.body?.customer)) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data: machine/customer not found');
  }

  if (!Array.isArray(req.body?.csvData) || req.body.csvData.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid Log Data: Data is missing or empty');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { csvData, machine, customer, loginUser, skip } = req.body;
    let { update } = req.body;
    const logsToInsert = []; 
    const logsToUpdate = [];

    if (skip)
      update = false;

    await Promise.all( csvData?.map(async (logObj) => {
      logObj.machine = machine;
      logObj.customer = customer;
      logObj.loginUser = loginUser;

      const fakeReq = { body: logObj };
      const query = { machine: logObj.machine, date: fakeReq.body.date };
      const existingLog = await ProductionLog.findOne(query).select('_id').lean();

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
      await ProductionLog.insertMany(logsToInsert, { session });
    }

    if (logsToUpdate.length > 0) {
      await Promise.all(logsToUpdate.map((log) =>
        this.dbservice.patchObject(ProductionLog, log._id, log.update, session)
      ));
    }

    await session.commitTransaction();
    res.status(StatusCodes.CREATED).json({ message: 'Logs processed successfully' });
  } catch (error) {
    await session.abortTransaction();
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  } finally {
    session.endSession();
  }
};



exports.patchLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(ProductionLog, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { loginUser, ...restBody } = req.body;
  
  let doc = {};

  if (reqType && reqType === "new") {
    doc = new ProductionLog({});
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