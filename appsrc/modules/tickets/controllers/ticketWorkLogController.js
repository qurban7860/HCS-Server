const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const LZString = require('lz-string');
const logger = require('../../config/logger');
const clients = new Map();

let DBService = require('../service/ticketDBService');
this.dbservice = new DBService();

const { TicketWorkLog } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = { isActive: true, isArchived: false };
this.orderBy = { updatedAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];
// const TicketEmailService = require('../service/ticketEmailService');
// this.ticketEmailService = new TicketEmailService();

exports.getTicketWorkLog = async (req, res, next) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    this.query.ticket = req.params.ticketId;
    this.query._id = req.params.id;

    const result = await this.dbservice.getObject(TicketWorkLog, this.query, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getTicketWorkLogs = async (req, res, next) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.query.ticket = req.params.ticketId;
    this.query.isActive = true;
    this.query.isArchived = false;

    const response = await this.dbservice.getObjectList(req, TicketWorkLog, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Work Log List get failed!");
  }
};

exports.postTicketWorkLog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    req.body.ticket = req.params?.ticketId;
    const response = await this.dbservice.postObject(getDocumentFromReq(req, "new"));

    this.ticketId = req.params.ticketId;
    this.query = { ticket: this.ticketId, isActive: true, isArchived: false };
    const workLogsList = await this.dbservice.getObjectList(req, TicketWorkLog, this.fields, this.query, this.orderBy, this.populate);

    broadcastWorkLogs(this.ticketId, workLogsList);
    req.body.isNew = true;
    req.params.id = response?._id;
    // await this.ticketEmailService.sendSupportTicketWorkLogEmail(req);
    res.status(StatusCodes.CREATED).json({ newWorkLog: response, workLogsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Add Work Log failed!");
  }
};

exports.patchTicketWorkLog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    req.body.ticket = req.params?.ticketId;

    const response = await this.dbservice.patchObject(TicketWorkLog, req.params.id, getDocumentFromReq(req));

    this.ticketId = req.params.ticketId;
    this.query = { ticket: this.ticketId, isActive: true, isArchived: false };
    const workLogsList = await this.dbservice.getObjectList(req, TicketWorkLog, this.fields, this.query, this.orderBy, this.populate);

    broadcastWorkLogs(this.ticketId, workLogsList);
    // await this.ticketEmailService.sendSupportTicketWorkLogEmail(req);

    res.status(StatusCodes.ACCEPTED).json({ updatedWorkLog: response, workLogsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Update Work Log failed!");
  }
};

exports.deleteTicketWorkLog = async (req, res, next) => {
  try {
    const existingWorkLog = await this.dbservice.getObjectById(TicketWorkLog, {}, req.params.id, this.populate);

    if (existingWorkLog.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the workLog author can delete this workLog");
    }
    await this.dbservice.patchObject(TicketWorkLog, req.params.id, getDocumentFromReq(req, "delete"));

    this.ticketId = req.params.ticketId;
    this.query = { ticket: this.ticketId, isActive: true, isArchived: false };
    const workLogsList = await this.dbservice.getObjectList(req, TicketWorkLog, this.fields, this.query, this.orderBy, this.populate);

    broadcastWorkLogs(this.ticketId, workLogsList);
    res.status(StatusCodes.OK).json({ workLogsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Delete Work Log failed!");
  }
};

function broadcastWorkLogs(ticket, workLogs) {
  const jsonString = JSON.stringify(workLogs);
  const compressed = LZString.compressToUTF16(jsonString);
  clients.forEach((client, clientId) => {
    if (clientId.includes(ticket)) {
      client.write(`data: ${compressed}\n\n`);
    }
  });
}

function getDocumentFromReq(req, reqType) {
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new TicketWorkLog({}) : {};

  const allowedFields = ["ticket", "timeSpent", "notes", "isActive", "isArchived"];

  allowedFields.forEach((field) => {
    if (field in req.body) {
      doc[field] = req.body[field];
    }
  });

  if (reqType == "new" && "loginUser" in req.body) {
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }
  if (reqType == "delete") {
    doc.isArchived = true;
    doc.isActive = false;
  }

  return doc;
}
