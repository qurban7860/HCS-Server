const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let calenderDBService = require('../service/calenderDBService')
this.dbservice = new calenderDBService();

const { Visit } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { visit_name: 1 };
this.populate = [
  { path: 'customer', select: 'name ref clientCode' },
  { path: 'site', select: 'name' },
  { path: 'contact', select: 'firstName lastName' },
  { path: 'notifyContacts', select: 'firstName lastName phone email' },
  { path: 'supportingTechnicians', select: 'firstName lastName phone email' },
  { path: 'machine', select: 'serialNo' },
  { path: 'technicians', select: 'name phone email' },
  { path: 'completedBy', select: 'name phone email' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

exports.getVisit = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(Visit, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getVisits = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    const response = await this.dbservice.getObjectList(req, Visit, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteVisit = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Visit, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postVisit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const requestedObject = getDocumentFromReq(req, 'new');
      console.log(requestedObject);
      const response = await this.dbservice.postObject(requestedObject);
      res.status(StatusCodes.CREATED).json({ Visit: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchVisit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(Visit, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

function getDocumentFromReq(req, reqType) {
  const { customer, site, contact, machine, jiraTicket, primaryTechnician, supportingTechnicians, notifyContacts, status,
    purposeOfVisit, visitNote, visitDate, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Visit({});
  }

  if ("customer" in req.body) {
    doc.customer = customer;
  }
  if ("site" in req.body) {
    doc.site = site;
  }

  if ("contact" in req.body) {
    doc.contact = contact;
  }
  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("jiraTicket" in req.body) {
    doc.jiraTicket = jiraTicket;
  }

  if ("primaryTechnician" in req.body) {
    doc.primaryTechnician = primaryTechnician;
  }
  if ("supportingTechnicians" in req.body) {
    doc.supportingTechnicians = supportingTechnicians;
  }
  if ("notifyContacts" in req.body) {
    doc.notifyContacts = notifyContacts;
  }
  if ("notifyContacts" in req.body) {
    doc.notifyContacts = notifyContacts;
  }
  if ("status" in req.body) {
    doc.status = status;
  }
  if ("purposeOfVisit" in req.body) {
    doc.purposeOfVisit = purposeOfVisit;
  }
  if ("visitNote" in req.body) {
    doc.visitNote = visitNote;
  }
  if ("visitDate" in req.body) {
    doc.visitDate = visitDate;
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