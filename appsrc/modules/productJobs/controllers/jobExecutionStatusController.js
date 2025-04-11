const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { JobExecutionStatus } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getJobExecutionStatus = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(JobExecutionStatus, this.query, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
  }
};

exports.getJobExecutionStatuses = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, JobExecutionStatus, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
  }
};

exports.postJobExecutionStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      this.query._id = response._id;
      const jobExecutionStatus = await this.dbservice.getObject(JobExecutionStatus, this.query, this.populate);
      return res.status(StatusCodes.CREATED).json(jobExecutionStatus);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
    }
  }
};

exports.patchJobExecutionStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      const jobExecutionStatus = await this.dbservice.patchObjectAndGet(JobExecutionStatus, req.params.id, getDocumentFromReq(req), this.populate);
      return res.status(StatusCodes.ACCEPTED).json(jobExecutionStatus);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
    }
  }
};

exports.deleteJobExecutionStatus = async (req, res, next) => {
  try {
    await this.dbservice.deleteObject(JobExecutionStatus, req.params.id);
    return res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Job execution status deleted successfully!', false));
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
  }
};

function getDocumentFromReq(req, reqType) {

  const { name, isDefault, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new JobExecutionStatus({});
  }

  if ("name" in req.body) {
    doc.name = name;
  }

  if ("isDefault" in req.body) {
    doc.isDefault = isDefault;
  }

  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
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