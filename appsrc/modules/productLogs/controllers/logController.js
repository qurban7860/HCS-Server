const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let logDBService = require('../service/logDBService')
this.dbservice = new logDBService();
const { CoilLog, ErpLog, ProductionLog, ToolCountLog, WasteLog } = require('../models');
const { Product } = require('../../products/models');
const { isValidDate  } = require('../../../../utils/formatTime');
const { convertAllInchesBitsToMM, convertTimestampToDate } = require('../utils/helpers');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'serialNo name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getLog = async ( req, res, next ) => {
  try {
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) {
      return res.status(400).send("Please Provide a valid Log ID!");
    }
    const Model = getModel( req );
    delete this.query?.type;
    const response = await this.dbservice.getObjectById(Model, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    const Model = getModel( req );
    delete this.query.type;

    if (this.query.searchKey && this.query.searchColumn) {
      if (this.query.searchColumn === '_id') {
        // For _id, we need to match the entire string
        if (mongoose.Types.ObjectId.isValid(this.query.searchKey)) {
          this.query._id = mongoose.Types.ObjectId(this.query.searchKey);
        } else {
          return res.status(400).send("Invalid _id format");
        }
      } else {
        // For other fields, use regex as before
        this.query[this.query.searchColumn] = { $regex: this.query.searchKey, $options: 'i' };
      }
      delete this.query.searchKey;
      delete this.query.searchColumn;
    }

    if( !(isValidDate(this.query?.fromDate) && isValidDate(this.query?.toDate)) && this.query?.toDate >= this.query?.fromDate ){
      return res.status(400).send("Please Provide valid date range!");
    }

    if(this.query?.fromDate && this.query?.toDate) {
      const startDate = new Date(this.query.fromDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(this.query.toDate);
      endDate.setHours(23, 59, 59, 999);

      if(this.query?.isCreatedAt) {
        this.query.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      } else {
        this.query.date = {
          $gte: startDate,
          $lte: endDate
        };
      }
    } else if (this.query?.hourly === 'last24Hours') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
      this.query.date = {
        $gte: twentyFourHoursAgo,
        $lte: now
      };
    }

    delete this.query?.fromDate;
    delete this.query?.toDate;
    delete this.query?.hourly;

    if (this.query?.customer && !this.query?.machine) {
      const activeMachines = await Product.find({ 
        customer: this.query.customer,
        isActive: true,
        isArchived: false 
      }).select('_id');
      
      this.query.machine = { 
        $in: activeMachines.map(machine => machine._id) 
      };
    }

    let response = await this.dbservice.getObjectList(req, Model, this.fields, this.query, this.orderBy, this.populate);

    if( !Array.isArray(response) && this.query?.customer && !this.query?.machine ){
      const machinesId = await Model.find({ customer: this.query?.customer }).select('machine').distinct('machine');
      const machines = await Product.find({ _id: { $in: machinesId } }).select('serialNo name').exec();
      response.machines = machines;
    }
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};

exports.getLogsByApiId = async (req, res, next) => {
  try {
    const { apiId, type } = req.query;

    if (!type?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).send("Log type is not defined!");
    }

    const validApiId = mongoose.Types.ObjectId.isValid(apiId);
    if (!validApiId) {
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid log API ID provided!");
    }

    req.query.type = type;
    const Model = getModel(req);

    const logs = await Model.find({ 
      apiLogId: mongoose.Types.ObjectId(apiId)
    }).populate(this.populate);

    res.json(logs);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};

exports.getLogsGraph = async (req, res, next) => {
  try {
    const LogModel = getModel(req);
    const { customer, machine, periodType, logGraphType } = req.query;

    const match = {};
    if (mongoose.Types.ObjectId.isValid(customer)) {
      match.customer = new mongoose.Types.ObjectId(customer);

      if (!machine) {
        const activeMachines = await Product.find({ 
          customer: match.customer,
          isActive: true,
          isArchived: false 
        }).select('_id');
        
        match.machine = { 
          $in: activeMachines.map(machine => machine._id) 
        };
      }
    }
    if (mongoose.Types.ObjectId.isValid(machine)) {
      match.machine = new mongoose.Types.ObjectId(machine);
    }

    let groupBy, dateRange, limit;
    const currentDate = new Date();

    switch ( periodType && periodType?.toLowerCase()) {
      case 'hourly':
        groupBy = {  $dateToString: { format: "%H:00", date: "$date" } };
        dateRange = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); 
        limit = 24;
        break;
      case 'daily':
        groupBy = { $dateToString: { format: "%d/%m", date: "$date" } };
        dateRange = new Date(currentDate.setDate(currentDate.getDate() - 30));
        limit = 30;
        break;
      case 'monthly':
        groupBy = { $dateToString: { format: "%Y-%m", date: "$date" } };
        dateRange = new Date(currentDate.setMonth(currentDate.getMonth() - 12));
        limit = 12;
        break;
      case 'quarterly':
        groupBy = {
          $concat: [
            { $toString: { $year: "$date" } },
            "-",
            "Q",
            { $toString: { $ceil: { $divide: [{ $month: "$date" }, 3] } } },
          ]
        };
        dateRange = new Date(currentDate.setMonth(currentDate.getMonth() - 15));
        limit = 4;
        break;
      case 'yearly':
        groupBy = { $dateToString: { format: "%Y", date: "$date" } };
        dateRange = new Date(currentDate.setFullYear(currentDate.getFullYear() - 5));
        limit = 5;
        break;
      default:
        return res.status(400).send("Invalid periodType! Must be hourly, daily, monthly, quarterly, or yearly.");
    }

    match.date = { $gte: dateRange };

    const groupStage = {
      $group: {
        _id: groupBy,
        componentLength: {
          $sum: {
            $convert: {
              input: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $type: "$componentLength" }, "null"] },
                      { $eq: [{ $type: "$componentLength" }, "missing"] },
                      {
                        $not: {
                          $regexMatch: {
                            input: { $toString: { $ifNull: ["$componentLength", "0"] } },
                            regex: /^-?\d*\.?\d+$/
                          }
                        }
                      }
                    ]
                  },
                  "0",
                  {
                    $replaceAll: {
                      input: { $toString: { $ifNull: ["$componentLength", "0"] } },
                      find: ",",
                      replacement: ""
                    }
                  }
                ]
              },
              to: "double",
              onError: 0,
              onNull: 0
            }
          }
        }
      }
    };

    if (logGraphType === 'productionRate') {
      groupStage.$group.time = {
        $sum: {
          $convert: {
            input: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $type: "$time" }, "null"] },
                    { $eq: [{ $type: "$time" }, "missing"] },
                    {
                      $not: {
                        $regexMatch: {
                          input: { $toString: { $ifNull: ["$time", "0"] } },
                          regex: /^-?\d*\.?\d+$/
                        }
                      }
                    }
                  ]
                },
                "0",
                { $ifNull: ["$time", "0"] }
              ]
            },
            to: "double",
            onError: 0,
            onNull: 0
          }
        }
      };
    } else {
      groupStage.$group.waste = {
        $sum: {
          $convert: {
            input: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $type: "$waste" }, "null"] },
                    { $eq: [{ $type: "$waste" }, "missing"] },
                    {
                      $not: {
                        $regexMatch: {
                          input: { $toString: { $ifNull: ["$waste", "0"] } },
                          regex: /^-?\d*\.?\d+$/
                        }
                      }
                    }
                  ]
                },
                "0",
                {
                  $replaceAll: {
                    input: { $toString: { $ifNull: ["$waste", "0"] } },
                    find: ",",
                    replacement: ""
                  }
                }
              ]
            },
            to: "double",
            onError: 0,
            onNull: 0
          }
        }
      };
    }

    const graphResults = await LogModel.aggregate([
      { $match: match },
      groupStage,
      {
        $project: {
          _id: 1,
          componentLength: { $round: ["$componentLength", 2] },
          ...(logGraphType === 'productionRate'
            ? { 
                time: { 
                  $round: ["$time", 2]
                } 
              }
            : { waste: { $round: ["$waste", 2] } })
        }
      },
      { $sort: { "_id": -1 } },
      { $limit: limit }
    ]);

    return res.json(graphResults);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
  }
};
exports.deleteLog = async (req, res, next) => {
  try {
    req.query.type = req.query?.type || req.body?.type;
    const Model = getModel( req );
    await this.dbservice.deleteObject(Model, req.params.id, res, callbackFunc );
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
      } else {
        res.status(StatusCodes.OK).send("Record Deleted Successfully");
      }
    }
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
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

  // Check if logs exceed the threshold limit
  const MAX_LOGS_THRESHOLD = parseInt(process.env.MAX_LOGS_THRESHOLD || '1000', 10);
  if (req.body.logs.length > MAX_LOGS_THRESHOLD) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: `Log count exceeds maximum threshold of ${MAX_LOGS_THRESHOLD}`,
      count: req.body.logs.length
    });
  }

  try {
    const { logs, machine, customer, version, loginUser, skip, type } = req.body;
    req.query.type = type;
    const Model = getModel(req);
    let { update } = req.body;
    const batchId = uuidv4();

    if (skip)
      update = false;

    // Convert inches to mm if needed
    let logsToProcess = logs;
    if (logs.some(log => log.measurementUnit === 'in')) {
      const convertedLogs = convertAllInchesBitsToMM(logs, type);
      if (convertedLogs === null) {
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid measurement values found in logs');
      }
      if (convertedLogs.error) {
        return res.status(StatusCodes.BAD_REQUEST).send(convertedLogs.error);
      }
      logsToProcess = convertedLogs;
    } else if (logs.some(log => log.measurementUnit && log.measurementUnit !== 'mm')) {
      return res.status(StatusCodes.BAD_REQUEST).send('Invalid measurement unit. Only "in" and "mm" are allowed.');
    }

    // Prepare arrays for bulk operations
    const logsToInsert = [];
    const logsToUpdate = [];

    // First pass: find existing logs to determine which need to be inserted vs updated
    const logQueries = logsToProcess.map(logObj => {
      logObj = convertTimestampToDate(logObj);
      return {
        machine,
        date: logObj.date
      };
    });

    // Use bulk find operation to get all existing logs in one query
    const existingLogs = await Model.find({
      $or: logQueries
    }).select('_id machine date').lean();

    // Create a map for quick lookup
    const existingLogsMap = {};
    existingLogs.forEach(log => {
      const key = `${log.machine}-${new Date(log.date).getTime()}`;
      existingLogsMap[key] = log._id;
    });

    // Process each log
    logsToProcess.forEach(logObj => {
      logObj = convertTimestampToDate(logObj);
      logObj.machine = machine;
      logObj.customer = customer;
      logObj.loginUser = loginUser;
      logObj.type = type;
      logObj.version = version;
      logObj.batchId = batchId;
      
      const dateKey = new Date(logObj.date).getTime();
      const lookupKey = `${machine}-${dateKey}`;
      const existingLogId = existingLogsMap[lookupKey];
      
      const fakeReq = { body: logObj, query: { type } };

      if (existingLogId && skip) {
        return; // Skip this log
      }

      if (existingLogId && update) {
        const updatedLog = getDocumentFromReq(fakeReq, res);
        logsToUpdate.push({ 
          updateOne: {
            filter: { _id: existingLogId },
            update: { $set: updatedLog }
          }
        });
      } else if (!existingLogId) {
        const newLog = getDocumentFromReq(fakeReq, 'new');
        logsToInsert.push({ 
          insertOne: { 
            document: newLog 
          }
        });
      }
    });

    // Perform bulk operations
    const results = { inserted: 0, updated: 0 };

    if (logsToInsert.length > 0) {
      const insertResult = await Model.bulkWrite(logsToInsert, { ordered: true });
      results.inserted = insertResult.insertedCount;
    }

    if (logsToUpdate.length > 0) {
      const updateResult = await Model.bulkWrite(logsToUpdate, { ordered: true });
      results.updated = updateResult.modifiedCount;
    }

    res.status(StatusCodes.CREATED).json({ 
      message: 'Logs processed successfully',
      inserted: results.inserted,
      updated: results.updated,
      total: results.inserted + results.updated
    });
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
      req.query.type = req.query?.type || req.body?.type;
      const LogModel = getModel( req );
      const result = await this.dbservice.patchObject(LogModel, req.params.id, getDocumentFromReq( req, res ));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }
};

function getModel(req) {
  const type = req.query?.type;

  if (!type?.trim()) {
    throw new Error("Log type is not defined!");
  }

  let Model;
  switch (type.toUpperCase()) {
    case 'COIL':
      Model = CoilLog;
      break;
    case 'ERP':
      Model = ErpLog;
      break;
    case 'PRODUCTION':
      Model = ProductionLog;
      break;
    case 'TOOLCOUNT':
      Model = ToolCountLog;
      break;
    case 'WASTE':
      Model = WasteLog;
      break;
    default:
      throw new Error(`Please provide a valid log type!`);
  }

  return Model;
}
exports.getModel = getModel;

function getDocumentFromReq(req, reqType) {
  const { loginUser, ...restBody } = req.body;
  let doc = { ...restBody };
  // const Model = getModel( req );
  // let doc = {};

  // if (reqType && reqType === "new") {
  //   doc = new Model({});
  // }

  // Object.keys(restBody).forEach((key) => {
  //   if (restBody[key] !== undefined) {
  //     doc[key] = restBody[key];
  //   }
  // });

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