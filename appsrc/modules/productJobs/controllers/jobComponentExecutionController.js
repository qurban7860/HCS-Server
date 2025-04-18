const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { JobComponentExecution, JobComponentExecutionStatus } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };

this.populate = [
  { path: 'job', select: 'unitOfLength profileName profileDescription frameset version' },
  {
    path: 'jobComponent',
    select: 'label labelDirection quantity length profileShape webWidth flangeHeight materialThickness materialGrade positions operations',
    populate: {
      path: 'operations',
      select: 'offset operationType',
      populate: {
        path: 'operationType',
        select: 'name',
      }
    }
  },
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



exports.getJobComponentExecution = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(JobComponentExecution, this.query, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.getJobComponentExecutions = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, JobComponentExecution, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.postJobComponentExecution = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      this.query = req.query != "undefined" ? req.query : {};
      if (!req.body.status) {
        this.query.isDefault = true;
        this.query.isActive = true;
        this.query.isArchived = false;
        const defaultStatus = await this.dbservice.getObject(JobComponentExecutionStatus, this.query, this.populate)
        if (defaultStatus?._id) {
          req.body.status = defaultStatus._id
        }
      }

      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      this.query._id = response._id;
      const jobComponentExecution = await this.dbservice.getObject(JobComponentExecution, this.query, this.populate);
      return res.status(StatusCodes.CREATED).json(jobComponentExecution);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.patchJobComponentExecution = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      if (req.body?.status)
        delete req.body.status
      const jobComponentExecution = await this.dbservice.patchObjectAndGet(JobComponentExecution, req.params.id, getDocumentFromReq(req), this.populate);
      return res.status(StatusCodes.ACCEPTED).json(jobComponentExecution);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.patchJobComponentExecutionStatus = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      this.query._id = req.params.jobComponentExecution;
      const status = req.params.id;
      const jobComponentExecution = await this.dbservice.getObject(JobComponentExecution, this.query, this.populate);

      const timeline = jobComponentExecution?.statusTimeline;
      if (Array.isArray(timeline) && timeline?.length > 0) {
        const latestStatus = timeline[0]?.status;
        if (status === latestStatus?._id) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Current status is same, please try different status!', true));
        }
      }

      const whereClause = { _id: req.params.jobComponentExecution, isActive: true, isArchived: false };
      const statusTimeline = { status, updatedBy: req.body.loginUser.userId, updatedIP: req.body.loginUser.userIP };
      const updateClause = { $push: { statusTimeline: { $each: [statusTimeline], $position: 0 } } };

      const updatedProcess = await JobComponentExecution.updateOne(whereClause, updateClause);
      if (updatedProcess) {
        return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordCustomMessageJSON(StatusCodes.ACCEPTED, 'Status updated successfully!', false));
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Status update failed!', true));
      }
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.deleteJobComponentExecution = async (req, res, next) => {
  try {
    await this.dbservice.deleteObject(JobComponentExecution, req.params.id);
    return res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, "Job Execution deleted successfully!", false));
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

function getDocumentFromReq(req, reqType) {

  const { job, jobComponent, startTime, endTime, status, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new JobComponentExecution({});
  }

  if ("job" in req.body) {
    doc.job = job;
  }

  if ("jobComponent" in req.body) {
    doc.jobComponent = jobComponent;
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