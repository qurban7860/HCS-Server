const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();
const _ = require('lodash');
const ticketFileController = require('./ticketFileController');
const ticketChangeController = require('./ticketHistoryController');
const {
  Ticket,
  TicketChangeReason,
  TicketChangeType,
  TicketImpact,
  TicketInvestigationReason,
  TicketIssueType,
  TicketRequestType,
  TicketPriority,
  TicketStatus,
  TicketStatusType
} = require('../models');
const { SecurityUser } = require('../../security/models');
const applyTicketFilter = require('../utils/ticketFilter');
const getDateFromUnitAndValue = require('../utils/getDateFromUnit');
const CounterController = require('../../counter/controllers/counterController');
const { sentenceCase } = require('../../../configs/utils/change_string_case');
const { statusPopulate } = require('./statusController');
const { requestTypePopulate } = require('./requestTypeController');
const TicketEmailService = require('../service/ticketEmailService');
this.ticketEmailService = new TicketEmailService();
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };

this.populate = [
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'serialNo name machineModel', populate: { path: 'machineModel', select: ' name' } },
  { path: 'reporter', select: 'firstName lastName' },
  { path: 'assignee', select: 'firstName lastName' },
  { path: 'approvers', select: 'firstName lastName' },
  { path: 'issueType', select: 'name icon color' },
  { path: 'requestType', select: 'name icon color' },
  { path: 'changeType', select: 'name icon color' },
  { path: 'impact', select: 'name icon color' },
  { path: 'priority', select: 'name icon color' },
  { path: 'status', select: 'name icon color statusType', populate: { path: 'statusType', select: ' name icon color slug isResolved' } },
  { path: 'changeReason', select: 'name icon color' },
  { path: 'investigationReason', select: 'name icon color' },
  { path: 'files', select: 'name fileType extension thumbnail eTag' },
  { path: 'createdBy', select: 'name contact', populate: { path: 'contact', select: 'firstName lastName' } },
  { path: 'updatedBy', select: 'name' }
];

this.listPopulate = [
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'serialNo name machineModel', populate: { path: 'machineModel', select: ' name' } },
  { path: 'reporter', select: 'firstName lastName' },
  { path: 'assignee', select: 'firstName lastName' },
  { path: 'approvers', select: 'firstName lastName' },
  { path: 'issueType', select: 'name icon color' },
  { path: 'requestType', select: 'name icon color' },
  { path: 'changeType', select: 'name icon color' },
  { path: 'impact', select: 'name icon color' },
  { path: 'priority', select: 'name icon color' },
  { path: 'status', select: 'name icon color statusType', populate: { path: 'statusType', select: ' name icon color slug isResolved' } },
  { path: 'changeReason', select: 'name icon color' },
  { path: 'investigationReason', select: 'name icon color' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

this.settingFields = "name issueType slug icon color isDefault isResolved";

exports.getTicket = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const finalQuery = await applyTicketFilter(req);
    if (finalQuery) {
      this.query = {
        ...this.query,
        ...finalQuery
      }
    }
    let result = await this.dbservice.getObject(Ticket, this.query, this.populate);
    if (!result?._id) {
      return res.status(StatusCodes.NOT_ACCEPTABLE).json("No resource found!");
    }
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getTicketCount = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    const startDate = getDateFromUnitAndValue({ unit: this.query?.unit, value: this.query?.value })
    const isResolved = this.query?.isResolved || null

    const [
      changeReason,
      changeType,
      impact,
      investigationReason,
      issueType,
      requestType,
      priority,
      status,
      statusType,
      statusTypes
    ] = await Promise.all([
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "changeReason",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketChangeReasons",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "changeType",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketChangeTypes",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "impact",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketImpacts",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "investigationReason",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketInvestigationReasons",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "issueType",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketIssueTypes",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "requestType",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketRequestTypes",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "priority",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketPriorities",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "status",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketStatuses",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isResolved,
        startDate
      }),
      this.dbservice.getCountsByGroups({
        model: Ticket,
        field: "status.statusType",
        localField: "status",
        subField: "statusType",
        collectionName: "TicketStatusTypes",
        localFieldCollectionName: "TicketStatuses",
        subFieldCollectionName: "TicketStatusTypes",
        propertiesToRetrieve: ["name", "color"],
        isSubFieldValue: true,
        isResolved,
        startDate
      })
    ]);

    const result = {
      changeReason,
      changeType,
      impact,
      investigationReason,
      issueType,
      requestType,
      priority,
      status,
      statusType,
      statusTypes
    }

    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};


exports.getTicketSettings = async (req, res, next) => {
  try {

    this.query = req.query != "undefined" ? req.query : {};
    this.orderBy = { displayOrderNo: 1 };
    this.query.isActive = true;
    this.query.isArchived = false;

    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    const [
      changeReasons,
      changeTypes,
      impacts,
      investigationReasons,
      issueTypes,
      requestTypes,
      priorities,
      statuses
    ] = await Promise.all([
      this.dbservice.getObjectList(req, TicketChangeReason, this.settingFields, this.query, this.orderBy),
      this.dbservice.getObjectList(req, TicketChangeType, this.settingFields, this.query, this.orderBy),
      this.dbservice.getObjectList(req, TicketImpact, this.settingFields, this.query, this.orderBy),
      this.dbservice.getObjectList(req, TicketInvestigationReason, this.settingFields, this.query, this.orderBy),
      this.dbservice.getObjectList(req, TicketIssueType, this.settingFields, this.query, this.orderBy),
      this.dbservice.getObjectList(req, TicketRequestType, this.settingFields, this.query, this.orderBy, requestTypePopulate),
      this.dbservice.getObjectList(req, TicketPriority, this.settingFields, this.query, this.orderBy),
      this.dbservice.getObjectList(req, TicketStatus, this.settingFields, this.query, this.orderBy, statusPopulate)
    ]);

    const result = {
      changeReasons,
      changeTypes,
      impacts,
      investigationReasons,
      issueTypes,
      requestTypes,
      priorities,
      statuses
    }

    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getTickets = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.orderBy = { name: 1 };
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    if (this.query?.isResolved || this.query?.statusType || !this.query?.status) {
      let query = { isActive: true, isArchived: false };
      let statusTypes = [];
      let statusTypesIds = [];
      let statusIds = [];
      if (this.query?.statusType) query._id = this.query?.statusType;
      if (this.query?.isResolved) query.isResolved = JSON.parse(this.query?.isResolved);
      if (Object.keys(query).length > 0 && !this.query?.status) {
        statusTypes = await TicketStatusType.find(query).select('_id').lean();
        statusTypesIds = statusTypes?.map(st => st._id);

        const statuses = await TicketStatus.find({ statusType: { $in: statusTypesIds }, isActive: true, isArchived: false }).select('_id').lean();
        statusIds = statuses.map(sti => sti._id);
        this.query.status = { $in: statusIds };
      }
      delete this.query.isResolved
      delete this.query.statusType
    }

    const finalQuery = await applyTicketFilter(req);
    if (finalQuery) {
      this.query = {
        ...this.query,
        ...finalQuery
      }
    }

    let result = await this.dbservice.getObjectList(req, Ticket, this.fields, this.query, this.orderBy, this.listPopulate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.searchTickets = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    const result = await this.dbservice.getObjectList(req, Ticket, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.postTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (!req.body?.loginUser?.userId) {
      return res.status(StatusCodes.BAD_REQUEST).send("User not found!");
    }
    const queryObject = {
      isDefault: true,
      isActive: true,
      isArchived: false,
    }

    if (!req.body.reporter || req.body.reporter == 'null') {
      const userData = await this.dbservice.getObjectById(SecurityUser, this.fields, req.body?.loginUser?.userId);
      req.body.reporter = userData?.contact;
    }

    if (!req.body.issueType || req.body.issueType == 'null') {
      const issueTypeData = await this.dbservice.getObject(TicketIssueType, queryObject);
      req.body.issueType = issueTypeData?._id;
    }

    if (!req.body.status || req.body.status == 'null') {
      const statusData = await this.dbservice.getObject(TicketStatus, queryObject);
      req.body.status = statusData?._id;
    }

    let ticketData = await getDocFromReq(req, 'new')
    const nextTicketNumber = await CounterController.getPaddedCounterSequence('supportTicket');
    ticketData.ticketNo = nextTicketNumber;
    ticketData = await this.dbservice.postObject(ticketData);
    req.params.ticketId = ticketData?._id;

    req.params.id = ticketData._id;
    try {
      await ticketFileController.saveTicketFiles(req);
    } catch (error) {
      if (ticketData) {
        await Ticket.deleteOne({ _id: ticketData._id });
      }
      throw new Error("Failed to complete the ticket creation process: " + error.message);
    }
    req.body.isNew = true;
    await this.ticketEmailService.sendSupportTicketEmail(req);
    return res.status(StatusCodes.ACCEPTED).json(ticketData);;
  } catch (error) {
    await CounterController.reversePaddedCounterSequence('supportTicket');
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.patchTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    req.params.ticketId = req.params.id;
    const oldObj = await this.dbservice.getObjectById(Ticket, this.fields, req.params.id);
    await this.dbservice.patchObject(Ticket, req.params.id, getDocFromReq(req));
    const fields = ["reporter", "assignee", "priority", "status"];
    const changedFields = {};

    fields.forEach((field) => {
      if (req.body?.[field] && req.body?.[field] !== oldObj?.[field]) {
        const newField = sentenceCase(field);
        changedFields[`previous${newField}`] = oldObj?.[field];
        changedFields[`new${newField}`] = req.body?.[field];
      }
    });

    if (Object.keys(changedFields).length > 0) {
      changedFields.loginUser = req.body?.loginUser
      changedFields.ticket = req.params.id
      await ticketChangeController.postTicketChange(changedFields);
    }

    await ticketFileController.saveTicketFiles(req);
    await this.ticketEmailService.sendSupportTicketEmail(req, oldObj);
    return res.status(StatusCodes.ACCEPTED).send("Ticket updated successfully!");
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.deleteTicket = async (req, res, next) => {
  try {
    await this.dbservice.deleteObject(Ticket, req.params.id, res);
    return res.status(StatusCodes.BAD_REQUEST).send("Ticket deleted successfully!");
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

function getDocFromReq(req, reqType) {
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new Ticket({}) : {};

  const allowedFields = [
    "customer", "machine", "issueType", "requestType", "description", "hlc", "plc", "summary", "changeType",
    "reporter", "assignee", "approvers", "impact", "priority", "status", "changeReason", "implementationPlan",
    "backoutPlan", "testPlan", "components", "groups", "shareWith", "investigationReason",
    "rootCause", "workaround", "plannedStartDate", "startTime", "plannedEndDate", "endTime", "isActive", "isArchived"
  ];

  allowedFields.forEach((f) => {
    if (f in req.body) {
      if (req.body[f] === "null") {
        doc[f] = null;
      } else {
        doc[f] = req.body[f];
      }
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