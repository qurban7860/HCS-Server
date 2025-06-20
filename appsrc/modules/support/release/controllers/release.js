const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const mongoose = require('mongoose');
const logger = require('../../../config/logger');
const rtnMsg = require('../../../config/static/static');

const CounterController = require('../../../counter/controllers/counterController');
const releaseDBService = require('../service/releaseDBService');
this.dbservice = new releaseDBService();

const Release = require('../models/release');
const Project = require('../../project/models/project')

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'project', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getRelease = async (req, res) => {
  try {
    const response = await this.dbservice.getObjectById(Release, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getReleases = async (req, res) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    const response = await this.dbservice.getObjectList(req, Release, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteRelease = async (req, res) => {
  try {
    const result = await this.dbservice.deleteObject(Release, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postRelease = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
  
  const isProjectExists = await this.dbservice.isExists(Project, { _id: mongoose.Types.ObjectId(req.body.project) });
  if (!isProjectExists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid project ID.');
  }

  const exists = await this.dbservice.isExists(Release, { name: req.body.name });
  if (exists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Release Name already exists.');
  }

  try {
    const releaseNumber = await CounterController.getPaddedCounterSequence('release');
    req.body.releaseNo = releaseNumber.toString() || '';
    const response = await this.dbservice.postObject(getReleaseFromReq(req, "new"));
    res.status(StatusCodes.CREATED).json({ Release: response });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchRelease = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
  
  if("project" in req.body){
    const isProjectExists = await this.dbservice.isExists(Project, { _id: mongoose.Types.ObjectId(req.body.project) });
    if (!isProjectExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Invalid project ID.');
    }
  }

  if("name" in req.body){
    const exists = await this.dbservice.isExists(Release, { name: req.body.name, _id: { $ne: req.params.id } });
    if (exists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Release Name already exists.');
    }
  }

  try {
    const result = await this.dbservice.patchObject(Release, req.params.id, getReleaseFromReq(req, "update"));
    res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function getReleaseFromReq(req, reqType) {
  const { releaseNo, project, name, description, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType === "new") {
    doc = new Release({});
  }

  if ("releaseNo" in req.body) doc.releaseNo = releaseNo;
  if ("project" in req.body) doc.project = project;
  if ("name" in req.body) doc.name = name.trim();
  if ("description" in req.body) doc.description = description?.trim() || '';
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
