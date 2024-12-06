const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../config/logger");

let logDBService = require("../service/logDBService");
this.dbservice = new logDBService();
const { CoilLog, ErpLog, ProductionLog, ToolCountLog, WasteLog } = require("../models");

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: "customer", select: "name" },
  { path: "machine", select: "serialNo name" },
  { path: "createdBy", select: "name" },
  { path: "updatedBy", select: "name" },
];

exports.postPublicLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  if (!mongoose.Types.ObjectId.isValid(req.machine?._id)) {
    return res.status(StatusCodes.BAD_REQUEST).send("Invalid Log Data: machine/customer not found");
  }

  if (!Array.isArray(req.body?.logs) || req.body?.logs?.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).send("Invalid Log Data: Data is missing or empty");
  }

  try {
    const { logs, version, type } = req.body;
    req.query.type = type;
    const Model = getModel(req);
    const logsToInsert = [];
    const batchId = uuidv4();

    logs.forEach((logObj) => {
      logObj = convertTimestampToDate(logObj);
      
      logObj.machine = req.machine._id;
      logObj.customer = req.customer._id;
      logObj.type = type;
      logObj.version = version;
      logObj.batchId = batchId;
      logObj.clientInfo = req.clientInfo;

      const fakeReq = { body: logObj };
      const newLog = addIdentifierData(fakeReq);
      logsToInsert.push(newLog);
    });

    if (logsToInsert.length > 0) {
      await Model.create(logsToInsert);
    }

    res.status(StatusCodes.CREATED).json({
      message: "Machine logs processed successfully",
      count: logsToInsert.length,
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};

function addIdentifierData(req) {
  const { clientInfo, ...restBody } = req.body;
  let doc = { ...restBody };

  doc.createdBy = clientInfo.identifier;
  doc.createdIP = clientInfo.ip;
  doc.createdAt = new Date();
  doc.updatedBy = null;
  doc.updatedIP = null;
  doc.updatedAt = null;

  return doc;
}

function getModel(req) {
  const type = req.query?.type;

  if (!type?.trim()) {
    throw new Error("Log type is not defined!");
  }

  let Model;
  switch (type.toUpperCase()) {
    case "COIL":
      Model = CoilLog;
      break;
    case "ERP":
      Model = ErpLog;
      break;
    case "PRODUCTION":
      Model = ProductionLog;
      break;
    case "TOOLCOUNT":
      Model = ToolCountLog;
      break;
    case "WASTE":
      Model = WasteLog;
      break;
    default:
      throw new Error(`Please provide a valid log type!`);
  }

  return Model;
}
function convertTimestampToDate(logObj) {
  if (logObj.timestamp && !logObj.date) {
    logObj.srcInfo = logObj.srcInfo || {};
    logObj.srcInfo.timestamp = logObj.timestamp;
    logObj.date = logObj.timestamp;
    delete logObj.timestamp;
  }
  return logObj;
}