const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { Job, Component } = require('../models');
const { ProductTool } = require('../../products/models');
const { getDocumentFromReq: createComponent, componentPopulate } = require('../controllers/componentController');
const { getDocumentFromReq: createTool } = require('../../products/controllers/productToolController');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'machine', select: 'serialNo name customer', populate: { path: 'customer', select: 'name' } },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getJob = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    let job = await this.dbservice.getObject(Job, this.query, this.populate);
    const jobComponents = await this.dbservice.getObjectList(req, Component, this.fields, { job: req.params.id }, this.orderBy, componentPopulate);
    job = { ...job, components: jobComponents };
    return res.json(job);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.getJobs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, Job, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

exports.postJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      const components = req.body.components
      this.query = req.query != "undefined" ? req.query : {};
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      this.query._id = response._id;

      // Process each component
      const results = await Promise.all(
        components.map(async (component) => {
          const operations = await Promise.all(
            (component.operations || []).map(async (operation) => {
              let tool = await findTool(operation.operationType);
              if (!tool) {
                const created = await this.dbservice.postObject(createTool({ body: { name: operation.operationType } }, 'new'));
                tool = created?._id
              }
              operation.operationType = tool._id || tool;
              return operation;
            })
          );
          component.operations = operations;
          component.job = response._id;
          return await this.dbservice.postObject(createComponent({ body: { ...component } }, 'new'));
        })
      );

      let job = await this.dbservice.getObject(Job, this.query, this.populate);
      const jobComponents = await this.dbservice.getObjectList(req, Component, this.fields, { job: response?._id }, this.orderBy, componentPopulate);
      job = { ...job, components: jobComponents };

      return res.status(StatusCodes.CREATED).json(job);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.patchJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, getReasonPhrase(StatusCodes.BAD_REQUEST), true));
  } else {
    try {
      const job = await this.dbservice.patchObject(Job, req.params.id, getDocumentFromReq(req));
      return res.status(StatusCodes.ACCEPTED).json(job);
    } catch (error) {
      logger.error(new Error(error));
      return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
    }
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Job, req.params.id);
    console.log({ result })
    return res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Job deleted successfully!', false));
  } catch (error) {
    logger.error(new Error(error));
    return res.status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .send(rtnMsg.recordCustomMessageJSON(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message, true));
  }
};

const findTool = async (toolName) => {
  return await ProductTool.findOne({ name: { $regex: `^${toolName}$`, $options: 'i' } })
}

function getDocumentFromReq(req, reqType) {

  const { machine, unitOfLength, profileName, profileDescription, frameset, csvVersion, isActive, isArchived, loginUser } = req.body;
  const { clientInfo } = req;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new Job({});
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("unitOfLength" in req.body) {
    doc.unitOfLength = unitOfLength;
  }

  if ("profileName" in req.body) {
    doc.profileName = profileName;
  }

  if ("profileDescription" in req.body) {
    doc.profileDescription = profileDescription;
  }

  if ("frameset" in req.body) {
    doc.frameset = frameset;
  }

  if ("csvVersion" in req.body) {
    doc.csvVersion = csvVersion;
  }

  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "clientInfo" in req) {
    doc.createdByIdentifier = clientInfo.identifier;
    doc.updatedByIdentifier = clientInfo.identifier;
    doc.createdIP = clientInfo.ip;
    doc.updatedIP = clientInfo.ip;
  } else if (reqType == "new" && "loginUser" in req.body) {
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("clientInfo" in req) {
    doc.updatedByIdentifier = clientInfo.identifier;
    doc.updatedIP = clientInfo.ip;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }
  return doc;
}


exports.getDocumentFromReq = getDocumentFromReq;