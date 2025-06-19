const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');
let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();
const { TicketChangeHistory } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'ticket', select: 'ticketNo' },
  { path: 'newReporter', select: 'name' },
  { path: 'previousReporter', select: 'name' },
  { path: 'newAssignees', select: 'name' },
  { path: 'previousAssignees', select: 'name' },
  { path: 'newPriority', select: 'name icon color' },
  { path: 'previousPriority', select: 'name icon color' },
  { path: 'newStatus', select: 'name icon color' },
  { path: 'previousStatus', select: 'name icon color' },
  { path: 'updatedBy', select: 'name' }
];


exports.getTicketHistory = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query.ticket = req.params.ticketId;
    this.query._id = req.params.id;

    const result = await this.dbservice.getObject(TicketChangeHistory, this.query, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getTicketHistories = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.query.ticket = req.params?.ticketId;
    let result = await this.dbservice.getObjectList(req, TicketChangeHistory, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.postTicketChange = async (obj) => {
  try {
    await this.dbservice.postObject(getDocFromReq(obj));
    return
  } catch (error) {
    logger.error(new Error(error));
    throw error
  }
};

function getDocFromReq(obj) {
  const { loginUser } = obj;
  const doc = new TicketChangeHistory({});

  const allowedFields = [
    "ticket",
    "previousReporter",
    "newReporter",
    "previousAssignees",
    "newAssignees",
    "previousPriority",
    "newPriority",
    "previousStatus",
    "newStatus"
  ];

  const nullableFields = new Set([
    "previousReporter",
    "newReporter",
  ]);

  allowedFields.forEach((f) => {
    if (f in obj) {
      if (nullableFields.has(f)) {
        doc[f] = obj[f];
      } else if (
        obj[f] !== null &&
        obj[f] !== "null" &&
        obj[f] !== undefined &&
        obj[f] !== "undefined" &&
        obj[f] !== ""
      ) {
        doc[f] = obj[f];
      }
    }
  });

  if ("loginUser" in obj) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }
  return doc;
}