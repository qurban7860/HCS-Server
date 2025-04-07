const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let emailDBService = require('../service/emailDBService')
this.dbservice = new emailDBService();

const { Email } = require('../models');
const { SecurityUser } = require('../../security/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getEmail = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(Email, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getEmails = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};

    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    let response = await this.dbservice.getObjectList(req, Email, this.fields, this.query, this.orderBy, this.populate);

    if (Array.isArray(response) && response.length > 0) {
      response = JSON.parse(JSON.stringify(response));
      let i = 0
      for (let email of response) {
        if (Array.isArray(email.toUsers) && email.toUsers.length > 0) {

          let toUsers = []

          for (let user of email.toUsers)
            toUsers.push(await SecurityUser.findById(user).select('name').lean());

          response[i].toUsers = toUsers;
          i++;
        }
      }

    }

    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteEmail = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Email, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

const newEmailLog = async (req) => {
  try {
    return await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
  } catch (error) {
    throw new Error("Email Log Save Failed!");
  }
};

exports.newEmailLog = newEmailLog;

exports.postEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const response = await newEmailLog(req);
      res.status(StatusCodes.CREATED).json({ Email: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(Email, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { status, subject, body, toEmails, fromEmail, toContacts, toUsers, customer,
    user, inviteUser, ticket, machine, event, serviceReport, dbBackup,
    isActive, isArchived, ccEmails, bccEmails, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Email({});
  }
  if ("status" in req.body) {
    doc.status = status;
  }

  if ("subject" in req.body) {
    doc.subject = subject;
  }

  if ("body" in req.body) {
    doc.body = body;
  }

  if ("toEmails" in req.body) {
    doc.toEmails = toEmails;
  }

  if ("fromEmail" in req.body) {
    doc.fromEmail = fromEmail;
  }

  if ("toContacts" in req.body) {
    doc.toContacts = toContacts;
  }

  if ("toUsers" in req.body) {
    doc.toUsers = toUsers;
  }

  if ("user" in req.body) {
    doc.user = user;
  }

  if ("inviteUser" in req.body) {
    doc.inviteUser = inviteUser;
  }

  if ("ticket" in req.body) {
    doc.ticket = ticket;
  }

  if ("machine" in req.body) {
    doc.machine = machine;
  }

  if ("event" in req.body) {
    doc.event = event;
  }

  if ("serviceReport" in req.body) {
    doc.serviceReport = serviceReport;
  }

  if ("dbBackup" in req.body) {
    doc.dbBackup = dbBackup;
  }

  if ("ccEmails" in req.body) {
    doc.ccEmails = ccEmails;
  }

  if ("bccEmails" in req.body) {
    doc.bccEmails = bccEmails;
  }

  if ("customer" in req.body) {
    doc.customer = customer;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
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