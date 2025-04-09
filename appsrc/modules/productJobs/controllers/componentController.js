const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
let JobgDBService = require('../service/jobDBService')
this.dbservice = new JobgDBService();
const { Component } = require('../models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  {
    path: 'operations',
    select: 'offset tool',
    populate: {
      path: 'tool',
      select: 'name'
    }
  },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getComponent = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(Component, this.query, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getComponents = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    let response = await this.dbservice.getObjectList(req, Component, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postComponent = async (req, res, next) => {
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

exports.patchComponent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(Component, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.deleteComponent = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Component, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


function getDocumentFromReq(req, reqType) {

  const { label, labelDirectory, quantity, length, profileShape, webWidth, flangeHeight, materialThickness, materialGrade, dimensions, operations, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Component({});
  }

  if ("label" in req.body) {
    doc.label = label;
  }

  if ("labelDirectory" in req.body) {
    doc.labelDirectory = labelDirectory;
  }

  if ("quantity" in req.body) {
    doc.quantity = quantity;
  }

  if ("length" in req.body) {
    doc.length = length;
  }

  if ("profileShape" in req.body) {
    doc.profileShape = profileShape;
  }

  if ("webWidth" in req.body) {
    doc.webWidth = webWidth;
  }

  if ("flangeHeight" in req.body) {
    doc.flangeHeight = flangeHeight;
  }
  if ("materialThickness" in req.body) {
    doc.materialThickness = materialThickness;
  }

  if ("materialGrade" in req.body) {
    doc.materialGrade = materialGrade;
  }

  if ("dimensions" in req.body) {
    doc.dimensions = dimensions;
  }

  if ("operations" in req.body) {
    doc.operations = operations;
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