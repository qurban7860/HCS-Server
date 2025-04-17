const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../config/logger");
const { convertAllInchesBitsToMM, convertTimestampToDate } = require('../utils/helpers');

let logDBService = require("../service/logDBService");
this.dbservice = new logDBService();
const { CoilLog, ErpLog, ProductionLog, ToolCountLog, WasteLog } = require("../models");
const APILog = require("../../apiclient/models/apilog");

// Common fields that should be present in all log formats
// const REQUIRED_COMMON_FIELDS = [
//   "operator",
//   "coilBatchName",
//   "coilLength",
//   "frameSet",
//   "componentLabel",
//   "webWidth",
//   "flangeHeight",
//   "profileShape",
//   "componentLength",
//   "waste",
//   "time"
// ];

// function validateRequiredFields(log) {
//   const missingFields = REQUIRED_COMMON_FIELDS.filter(field => !log.hasOwnProperty(field));
//   if (missingFields.length > 0) {
//     throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
//   }
//   return true;
// }

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
  const startTime = Date.now();
  const clientIP = req.clientInfo?.ip;
  let apiLogEntry;

  try {
    apiLogEntry = await logApiCall({
      req,
      startTime,
      responseData: {
        statusCode: StatusCodes.ACCEPTED,
        body: {
          message: "Request received, processing machine logs",
          count: req.body?.logs?.length || 0,
        },
        context: "Started processing request",
      },
      machine: req.machine,
      createdIP: clientIP,
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.BAD_REQUEST,
          response: JSON.stringify({ errors: errors.array() }),
          responseMessage: "Validation failed",
          noOfRecordsUpdated: 0,
        },
        { new: true }
      );
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: getReasonPhrase(StatusCodes.BAD_REQUEST)
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.machine?._id)) {
      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.BAD_REQUEST,
          response: JSON.stringify({ error: "Invalid machine/customer" }),
          responseMessage: "Invalid Log Data: machine/customer not found",
          noOfRecordsUpdated: 0,
        },
        { new: true }
      );
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Invalid Log Data: machine/customer not found'
      });
    }

    if (!Array.isArray(req.body?.logs) || req.body?.logs?.length === 0) {
      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.BAD_REQUEST,
          response: JSON.stringify({ error: "Missing or empty logs array" }),
          responseMessage: "Invalid Log Data: Data is missing or empty",
          noOfRecordsUpdated: 0,
        },
        { new: true }
      );
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Invalid Log Data: Data is missing or empty'
      });
    }

    // Check if logs exceed the threshold limit
    const MAX_LOGS_THRESHOLD = parseInt(process.env.MAX_LOGS_THRESHOLD || '1000', 10);
    if (req.body.logs.length > MAX_LOGS_THRESHOLD) {
      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.BAD_REQUEST,
          response: JSON.stringify({ 
            error: `Log count exceeds maximum threshold of ${MAX_LOGS_THRESHOLD}`,
            count: req.body.logs.length
          }),
          responseMessage: "Too many logs in single request",
          noOfRecordsUpdated: 0,
        },
        { new: true }
      );
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: `Log count exceeds maximum threshold of ${MAX_LOGS_THRESHOLD}`,
        count: req.body.logs.length
      });
    }

    const { logs, version, type } = req.body;

    req.query.type = type;
    const Model = getModel(req);
    const batchId = uuidv4();

    // Convert inches to mm if needed
    let logsToProcess = logs;
    if (logs.some(log => log.measurementUnit === 'in')) {
      const convertedLogs = convertAllInchesBitsToMM(logs, type);
      if (convertedLogs === null) {
        await APILog.findByIdAndUpdate(
          apiLogEntry._id,
          {
            responseStatusCode: StatusCodes.BAD_REQUEST,
            response: JSON.stringify({ error: "Invalid measurement values found in logs" }),
            responseMessage: "Invalid measurement values found in logs",
            noOfRecordsUpdated: 0,
          },
          { new: true }
        );
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Invalid measurement values found in logs'
        });
      }
      if (convertedLogs.error) {
        await APILog.findByIdAndUpdate(
          apiLogEntry._id,
          {
            responseStatusCode: StatusCodes.BAD_REQUEST,
            response: JSON.stringify({ error: convertedLogs.error }),
            responseMessage: convertedLogs.error,
            noOfRecordsUpdated: 0,
          },
          { new: true }
        );
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: convertedLogs.error
        });
      }
      logsToProcess = convertedLogs;
    } else if (logs.some(log => log.measurementUnit && log.measurementUnit !== 'mm')) {
      const errorMessage = 'Invalid measurement unit. Only "in" and "mm" are allowed.';
      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.BAD_REQUEST,
          response: JSON.stringify({ error: errorMessage }),
          responseMessage: errorMessage,
          noOfRecordsUpdated: 0,
        },
        { new: true }
      );
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: errorMessage
      });
    }

    // Prepare documents for bulk operation
    const logsToInsert = logsToProcess.map((logObj) => {
      logObj = convertTimestampToDate(logObj);

      logObj.machine = req.machine._id;
      logObj.customer = req.customer._id;
      logObj.type = type;
      logObj.version = version;
      logObj.batchId = batchId;
      logObj.clientInfo = req.clientInfo;
      logObj.apiLogId = apiLogEntry._id;

      const fakeReq = { body: logObj };
      return addIdentifierData(fakeReq);
    });

    if (logsToInsert.length > 0) {
      // Use MongoDB's bulk operation for more efficient insertion
      const bulkOps = logsToInsert.map(doc => ({
        insertOne: { document: doc }
      }));
      
      const bulkResult = await Model.bulkWrite(bulkOps, { ordered: true });
      const insertedCount = bulkResult.insertedCount;
      const finalResponseTime = Date.now() - startTime;

      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.CREATED,
          response: JSON.stringify({
            message: "Machine logs processed successfully",
            count: insertedCount,
          }),
          responseMessage: `Successfully processed ${insertedCount} ${type} logs`,
          noOfRecordsUpdated: insertedCount,
          responseTime: `${finalResponseTime}`,
        },
        { new: true }
      );

      res.status(StatusCodes.CREATED).json({
        message: "Machine logs processed successfully",
        count: insertedCount,
      });
    } else {
      throw new Error("No valid logs to insert");
    }
  } catch (error) {
    if (apiLogEntry) {
      const errorResponseTime = Date.now() - startTime;
      await APILog.findByIdAndUpdate(
        apiLogEntry._id,
        {
          responseStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          response: JSON.stringify({ error: error.message }),
          responseMessage: "Error Processing Machine Logs",
          noOfRecordsUpdated: 0,
          responseTime: `${errorResponseTime}`,
        },
        { new: true }
      );
    }
    await logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};
const logApiCall = async ({ req, startTime, responseData, machine = null, createdIP, createdBy }) => {
  const apiLog = new APILog({
    requestMethod: req.method,
    requestURL: req.originalUrl,
    requestHeaders: req.headers,
    machine: machine ? machine._id : null,
    customer: machine?.customer,
    apiType: "MACHINE-LOGS",
    responseTime: `${Date.now() - startTime}`,
    response: JSON.stringify(responseData.body),
    responseStatusCode: responseData.statusCode,
    responseMessage: responseData.context,
    noOfRecordsUpdated: responseData?.noOfRecordsUpdated || 0,
    createdAt: new Date(),
    createdIP: req?.clientInfo?.ip || createdIP,
    createdByIdentifier: req?.clientInfo?.identifier || createdBy || null,
  });
  return apiLog.save();
};

function addIdentifierData(req) {
  const { clientInfo, ...restBody } = req.body;
  let doc = { ...restBody };

  doc.createdByIdentifier = clientInfo.identifier;
  doc.createdIP = clientInfo.ip;
  doc.createdAt = new Date();
  doc.updatedByIdentifier = clientInfo.identifier;
  doc.updatedIP = clientInfo.ip;
  doc.updatedAt = new Date();

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