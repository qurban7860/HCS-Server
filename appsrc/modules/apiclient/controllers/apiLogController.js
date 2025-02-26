const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let apiClientDBService = require('../service/apiClientDBService')
const dbFetchPaginatedResults = require('../../db/dbFetchPaginatedResults');
this.dbservice = new apiClientDBService();

const { apilog } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'countries', select: '' },
  { path: 'machine', select: 'name serialNo' }
];



exports.getApiLog = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(apilog, this.fields, req.params.id, this.populate);
    let updatedResponse = response;
    if (response?.countries?.length > 0) {
      const updatedCountries = response.countries.map((country) => ({
        ...country.toObject(),
        name: country.country_name, 
      }));
      updatedResponse = { ...response.toObject(), countries: updatedCountries };
    }
      
    res.json(updatedResponse);

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getApiLogs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};

    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    if(this.query.fields) {
      this.fields = this.query.fields;
      delete this.query.fields;
    } 

    if(this.query?.fromDate && this.query?.toDate) {
      const startDate = new Date(this.query.fromDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(this.query.toDate);
      endDate.setHours(23, 59, 59, 999);

      this.query.createdAt = {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      };
    }

    delete this.query?.fromDate;
    delete this.query?.toDate;

    if (this.query['machine.serialNo']) {
      const serialNoQuery = this.query['machine.serialNo'];
      delete this.query['machine.serialNo'];
      
      const matchingMachines = await mongoose.model('Machine').find({
        serialNo: serialNoQuery
      }).select('_id');
      
      this.query.machine = {
        $in: matchingMachines.map(m => m._id)
      };
    }

    // const page = parseInt(req.body.page) + 1 || 1;
    // const pageSize = parseInt(req.body.pageSize) || 10;

    // const response = await dbFetchPaginatedResults(
    //   apilog,
    //   this.query,
    //   this.fields,
    //   this.orderBy,
    //   this.populate,
    //   page,
    //   pageSize
    // );

    // Temporarily return all results without pagination
    const response = await apilog.find(this.query)
      .select(this.fields)
      .sort(this.orderBy)
      .populate(this.populate)
      .limit(1000);

    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteApiLog = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(apilog, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postApiLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      

      req.body.responseStatusCode = 200;
      req.body.response = "APPROVED";
      req.body.responseTime = "123";
      
      let reqBodyInsertion = getDocumentFromReq(req, 'new');
      
      const response = await this.dbservice.postObject(reqBodyInsertion);
      res.status(StatusCodes.CREATED).json({ ApiLog: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

function getDocumentFromReq(req, reqType) {
  const { machine, customer, apiType, refUUID, responseTime, response, responseStatusCode, responseMessage, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType === 'new') {
    doc = new apilog({});
  }

  doc.requestMethod = req.method;
  doc.requestURL = req.originalUrl;

  doc.requestHeaders = req.headers; if (doc.requestHeaders) delete doc.requestHeaders.authorization;
  
  doc.requestBody = req.body; if (doc.requestBody) delete doc.requestBody.loginUser;

  if (machine !== undefined) {
    doc.machine = machine;
  }
  if (customer !== undefined) {
    doc.customer = customer;
  }
  if (apiType !== undefined) {
    doc.apiType = apiType;
  }
  if (refUUID !== undefined) {
    doc.refUUID = refUUID;
  }

  if (responseTime !== undefined) {
    doc.responseTime = responseTime;
  }


  if (response !== undefined) {
    doc.response = response;
  }

  if (responseStatusCode !== undefined) {
    doc.responseStatusCode = responseStatusCode;
  }

  if (responseMessage !== undefined) {
    doc.responseMessage = responseMessage;
  }

  if (reqType === 'new' && loginUser !== undefined) {
    doc.createdBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
  }

  return doc;
}


exports.getDocumentFromReq = getDocumentFromReq;