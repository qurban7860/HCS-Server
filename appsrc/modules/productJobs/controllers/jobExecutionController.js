const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { JobExecution, JobExecutionStatus } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };

this.populate = [
  { path: 'machine', select: 'serialNo name customer', populate: { path: 'customer', select: 'name' } },
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
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.getJobExecutions = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, JobExecution, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.postJobExecution = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      this.query = req.query != "undefined" ? req.query : {};
      if (!req.body.status) {
        this.query.isDefault = true;
        this.query.isActive = true;
        this.query.isArchived = false;
        const defaultStatus = await this.dbservice.getObject(JobExecutionStatus, this.query, this.populate)
        if (defaultStatus?._id) {
          req.body.status = defaultStatus._id
        }
      }

      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      this.query._id = response._id;
      const jobExecution = await this.dbservice.getObject(JobExecution, this.query, this.populate);
      return res.status(StatusCodes.CREATED).json(jobExecution);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.patchJobExecution = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      if (req.body?.status)
        delete req.body.status
      const jobExecution = await this.dbservice.patchObjectAndGet(JobExecution, req.params.id, getDocumentFromReq(req), this.populate);
      return res.status(StatusCodes.ACCEPTED).json(jobExecution);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.patchJobExecutionStatus = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      this.query._id = req.params.jobExecution;
      const status = req.params.id;
      const jobExecution = await this.dbservice.getObject(JobExecution, this.query, this.populate);

      const timeline = jobExecution?.statusTimeline;
      if (Array.isArray(timeline) && timeline?.length > 0) {
        const latestStatus = timeline[0]?.status;
        if (status === latestStatus?._id) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Current status is same, please try different status!', true));
        }
      }

      const whereClause = { _id: req.params.jobExecution, isActive: true, isArchived: false };
      const statusTimeline = { status, updatedBy: req.body.loginUser.userId, updatedIP: req.body.loginUser.userIP };
      const updateClause = { $push: { statusTimeline: { $each: [statusTimeline], $position: 0 } } };

      const updatedProcess = await JobExecution.updateOne(whereClause, updateClause);
      if (updatedProcess) {
        return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordCustomMessageJSON(StatusCodes.ACCEPTED, 'Status updated successfully!', false));
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Status update failed!', true));
      }
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.deleteJobExecution = async (req, res, next) => {
  try {
    await this.dbservice.deleteObject(JobExecution, req.params.id);
    return res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, "Job Execution deleted successfully!", false));
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
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