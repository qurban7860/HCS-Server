const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { JobComponentExecutionStatus, JobComponentExecution } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getJobComponentExecutionStatus = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(JobComponentExecutionStatus, this.query, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.getJobComponentExecutionStatuses = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, JobComponentExecutionStatus, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.postJobComponentExecutionStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      this.query._id = response._id;
      const jobComponentExecutionStatus = await this.dbservice.getObject(JobComponentExecutionStatus, this.query, this.populate);
      return res.status(StatusCodes.CREATED).json(jobComponentExecutionStatus);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.patchJobComponentExecutionStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      if (req.body.isArchived) {
        const statusId = mongoose.Types.ObjectId(req.params.id);

        const query = {
          $expr: {
            $eq: [
              { $arrayElemAt: ['$statusTimeline.status', 0] },
              statusId
            ]
          }
        };

        const response = await this.dbservice.getObject(JobComponentExecution, query);

        if (response?._id) {
          return res.status(StatusCodes.BAD_REQUEST).send(
            rtnMsg.recordCustomMessageJSON(
              StatusCodes.BAD_REQUEST,
              'Status is used in job component executions!',
              true
            )
          );
        }
      }
      const jobComponentExecutionStatus = await this.dbservice.patchObjectAndGet(JobComponentExecutionStatus, req.params.id, getDocumentFromReq(req), this.populate);
      return res.status(StatusCodes.ACCEPTED).json(jobComponentExecutionStatus);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.deleteJobComponentExecutionStatus = async (req, res, next) => {
  try {
    await this.dbservice.deleteObject(JobComponentExecutionStatus, req.params.id);
    return res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Job execution status deleted successfully!', false));
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

function getDocumentFromReq(req, reqType) {

  const { name, isDefault, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new JobComponentExecutionStatus({});
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