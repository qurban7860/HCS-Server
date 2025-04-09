const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { JobExecution } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };

this.populate = [
  { path: 'machine', select: 'serialNo name' },
  {
    path: 'job', select: 'measurementUnit profile frameset version components',
    populate: {
      path: 'components',
      select: 'label labelDirectory quantity length profileShape webWidth flangeHeight materialThickness materialGrade dimensions operations',
      populate: {
        path: 'operations',
        select: 'offset tool',
        populate: {
          path: 'tool',
          select: 'name',
        }
      }
    },
  },
  { path: 'status', select: 'name' },
  {
    path: 'statusTimeline', select: 'updatedAt updatedIP updatedBy status',
    populate: {
      path: 'updatedBy',
      select: 'name'
    },
    populate: {
      path: 'status',
      select: 'name'
    }
  },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getJobExecution = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(JobExecution, this.query, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getJobExecutions = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, JobExecution, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postJobExecution = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchJobExecution = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(JobExecution, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchJobExecutionStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(JobExecution, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.deleteJobExecution = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(JobExecution, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function getDocumentFromReq(req, reqType) {

  const { machine, job, startTime, endTime, status, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new JobExecution({});
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("job" in req.body) {
    doc.job = job;
  }

  if ("startTime" in req.body) {
    doc.startTime = startTime;
  }

  if ("endTime" in req.body) {
    doc.endTime = endTime;
  }

  if ("status" in req.body) {
    doc.status = status;
    if (reqType == "new" && "loginUser" in req.body) {
      doc.statusTimeline = [{
        status,
        updatedBy: loginUser.userId,
        updatedIP: loginUser.userIP
      }];
    }
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