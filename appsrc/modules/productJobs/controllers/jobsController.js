const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { Job } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  {
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
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getJob = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(Job, this.query, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
  }
};

exports.getJobs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, Job, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
  }
};

exports.postJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      this.query = req.query != "undefined" ? req.query : {};
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      this.query._id = response._id;
      const job = await this.dbservice.getObject(Job, this.query, this.populate);
      return res.status(StatusCodes.CREATED).json(job);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
    }
  }
};

exports.patchJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      const job = await this.dbservice.patchObject(Job, req.params.id, getDocumentFromReq(req));
      return res.status(StatusCodes.ACCEPTED).json(job);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
    }
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Job, req.params.id);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Job deleted successfully!', false));
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.INTERNAL_SERVER_ERROR, error._message, true));
  }
};

function getDocumentFromReq(req, reqType) {

  const { measurementUnit, profile, frameset, version, components, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Job({});
  }

  if ("measurementUnit" in req.body) {
    doc.measurementUnit = measurementUnit;
  }

  if ("profile" in req.body) {
    doc.profile = profile;
  }

  if ("frameset" in req.body) {
    doc.frameset = frameset;
  }

  if ("version" in req.body) {
    doc.version = version;
  }

  if ("components" in req.body) {
    doc.components = components;
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