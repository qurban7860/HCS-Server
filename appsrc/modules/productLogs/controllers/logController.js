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
const { isValidDate, validateYear  } = require('../../../../utils/formatTime');

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
          // If it's not a valid ObjectId, we can't search for it
          return res.status(400).send("Invalid _id format");
        }
      } else {
        // For other fields, use regex as before
        this.query[this.query.searchColumn] = { $regex: this.query.searchKey, $options: 'i' };
      }
      delete this.query.searchKey;
      delete this.query.searchColumn;
    }

    if( !(isValidDate(this.query?.fromDate) && isValidDate(this.query?.toDate)) && this.query?.toDate > this.query?.fromDate ){
      return res.status(400).send("Please Provide valid date range!");
    }

    if(this.query?.fromDate && this.query?.toDate) {
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

exports.getLogsGraph = async (req, res, next) => {
  try {
    const LogModel = getModel(req);
    const { customer, machine, periodType, logGraphType } = req.query;

    const match = {};
    if (mongoose.Types.ObjectId.isValid(customer)) {
      match.customer = new mongoose.Types.ObjectId(customer);
    }
    if (mongoose.Types.ObjectId.isValid(machine)) {
      match.machine = new mongoose.Types.ObjectId(machine);
    }

    let groupBy, dateRange, limit;
    const currentDate = new Date();

    switch ( periodType && periodType?.toLowerCase()) {
      case 'daily':
        groupBy = { $dateToString: { format: "%m/%d", date: "$date" } };
        dateRange = new Date(currentDate.setDate(currentDate.getDate() - 7));
        limit = 7;
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
        return res.status(400).send("Invalid periodType! Must be daily, monthly, quarterly, or yearly.");
    }

    match.date = { $gte: dateRange };

    const groupStage = {
      $group: {
        _id: groupBy,
        componentLength: {
          $sum: {
            $toDouble: {
              $replaceAll: {
                input: { $ifNull: ["$componentLength", "0"] },
                find: ",",
                replacement: ""
              }
            }
          }
        }
      }
    };

    if (logGraphType === 'productionRate') {
      groupStage.$group.time = {
        $sum: {
          $cond: [
            { $ifNull: ["$time", false] },
            { $toDouble: "$time" },
            "NA"
          ]
        }
      };
    } else {
      groupStage.$group.waste = {
        $sum: {
          $toDouble: {
            $replaceAll: {
              input: { $ifNull: ["$waste", "0"] },
              find: ",",
              replacement: ""
            }
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
            ? { time: { $cond: [{ $eq: ["$time", "NA"] }, "NA", { $round: ["$time", 2] }] } }
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

  try {
    const { logs, machine, customer, version, loginUser, skip, type } = req.body;
    req.query.type = type;
    const Model = getModel( req );
    let { update } = req.body;
    const logsToInsert = [];
    const logsToUpdate = [];

    const batchId = uuidv4();

    if (skip)
      update = false;

    await Promise.all( logs?.map(async (logObj) => {
        logObj.machine = machine;
        logObj.customer = customer;
        logObj.loginUser = loginUser;
        logObj.type = type;
        logObj.version = version;
        logObj.batchId = batchId;
        const fakeReq = { body: logObj, query: { type } };
        const query = { machine: logObj.machine, date: fakeReq.body.date };
        const existingLog = await Model.findOne(query).select('_id').lean();

        if (existingLog && skip) {
          return;
        }

        if (existingLog && update) {
          const updatedLog = getDocumentFromReq(fakeReq, res );
          logsToUpdate.push({ _id: existingLog._id, update: updatedLog });
        } else if (!existingLog) {
          const newLog = getDocumentFromReq(fakeReq, 'new');
          logsToInsert.push(newLog);
        }
    }));

    if (logsToInsert.length > 0) {
      await Model.create(logsToInsert);
    }

    if (logsToUpdate.length > 0) {
      await Promise.all(logsToUpdate.map((log) =>
        Model.updateOne({ _id: log._id }, { $set: log.update })
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