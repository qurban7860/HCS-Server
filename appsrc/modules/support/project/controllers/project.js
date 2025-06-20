const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const mongoose = require('mongoose');
const logger = require('../../../config/logger');
const rtnMsg = require('../../../config/static/static');

const CounterController = require('../../../counter/controllers/counterController');
const projectDBService = require('../service/projectDBService');
this.dbservice = new projectDBService();

const Project = require('../models/project');
const Release = require('../../release/models/release')

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getProject = async (req, res) => {
  try {
    const response = await this.dbservice.getObjectById(Project, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getProjects = async (req, res) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    const response = await this.dbservice.getObjectList(req, Project, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const ReleaseCount = await Release.countDocuments({ project: req.params.id });
    
    if (ReleaseCount > 0) {
      return res.status(StatusCodes.BAD_REQUEST).send('Project cannot be deleted as it is assigned to one or more Releases.');
    }
    const result = await this.dbservice.deleteObject(Project, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
  
  const exists = await this.dbservice.isExists(Project, { name: req.body.name });
  if (exists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Project Name already exists.');
  }

  try {
    const projectNumber = await CounterController.getPaddedCounterSequence('project');
    req.body.projectNo = projectNumber.toString() || '';
    const response = await this.dbservice.postObject(getProjectFromReq(req, "new"));
    res.status(StatusCodes.CREATED).json({ Project: response });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
  
  if("name" in req.body){
    const exists = await this.dbservice.isExists(Project, { name: req.body.name, _id: { $ne: req.params.id } });
    if (exists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Project Name already exists.');
    }
  }

  try {
    const result = await this.dbservice.patchObject(Project, req.params.id, getProjectFromReq(req, "update"));
    res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function getProjectFromReq(req, reqType) {
  const { projectNo, name, description, customerAccess, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType === "new") {
    doc = new Project({});
  }
  
  if ("projectNo" in req.body) doc.projectNo = projectNo;
  if ("name" in req.body) doc.name = name.trim();
  if ("description" in req.body) doc.description = description?.trim() || '';
  if ("customerAccess" in req.body) doc.customerAccess = customerAccess;
  if ("isActive" in req.body) doc.isActive = isActive;
  if ("isArchived" in req.body) doc.isArchived = isArchived;

  if (reqType === "new" && "loginUser" in req.body) {
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
