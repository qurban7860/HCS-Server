const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const getDateFromUnitAndValue = require('../utils/getDateFromUnit');
let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();
const _ = require('lodash');
const { Ticket, TicketFault } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { displayOrderNo: 1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getTicketCountByFault = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    const startDate = getDateFromUnitAndValue({ unit: this.query?.unit, value: this.query?.value })
    const isResolved = this.query?.isResolved || null
    const result = await this.dbservice.getCountsByGroups({
      model: Ticket,
      field: "faults",
      localField: "status",
      subField: "statusType",
      collectionName: "TicketFaults",
      localFieldCollectionName: "TicketStatuses",
      subFieldCollectionName: "TicketStatusTypes",
      propertiesToRetrieve: ["name", "color"],
      isResolved,
      startDate
    })
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getTicketFault = async (req, res, next) => {
  try {
    const result = await this.dbservice.getObjectById(TicketFault, this.fields, req.params.id, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getTicketFaults = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    const result = await this.dbservice.getObjectList(req, TicketFault, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getDefaultTicketFaults = async (req) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query.isArchived = false;
    this.query.isActive = true;
    this.query.isDefault = true;
    const result = await this.dbservice.getObjectList(req, TicketFault, this.fields, this.query, this.orderBy, this.populate);
    return result.map(f => f?._id);
  } catch (error) {
    throw new Error(error);
  }
};

exports.searchTicketFaults = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    const result = await this.dbservice.getObjectList(req, TicketFault, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};


exports.postTicketFault = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    const result = await this.dbservice.postObject(getDocFromReq(req, 'new'));
    return res.status(StatusCodes.ACCEPTED).json(result);;
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.patchTicketFault = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    if (req.body?.isArchived) {
      this.query.issueType = req.params.id;
      this.query.isArchived = false;
      const result = await this.dbservice.getObject(Ticket, this.query);
      if (result?._id) {
        logger.info(new Error(errors));
        return res.status(StatusCodes.BAD_REQUEST).send("Fault used in the Ticket can't be inactive or archived!");
      }
    }
    await this.dbservice.patchObject(TicketFault, req.params.id, getDocFromReq(req));
    return res.status(StatusCodes.ACCEPTED).send(`Fault ${req.body?.isArchived ? "archived" : "updated"} successfully!`);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.deleteTicketFault = async (req, res, next) => {
  try {
    await this.dbservice.deleteObject(TicketFault, req.params.id);
    return res.status(StatusCodes.BAD_REQUEST).send("Fault deleted successfully!");
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

function getDocFromReq(req, reqType) {
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new TicketFault({}) : {};

  const allowedFields = ["name", "description", "slug", "displayOrderNo", "isDefault", "icon", "color", "isActive", "isArchived"];

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

  return doc;
}