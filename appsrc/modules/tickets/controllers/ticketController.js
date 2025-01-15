const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
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
  TicketPriority,
  TicketStatus
} = require('../models');
const { SecurityUser } = require('../../security/models');
const CounterController = require('../../counter/controllers/counterController');
const { sentenceCase } = require('../../../configs/utils/change_string_case');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  { path: 'customer', select: 'name'  },
  { path: 'machine', select: 'serialNo name' },
  { path: 'reporter', select: 'firstName lastName' },
  { path: 'assignee', select: 'firstName lastName' },
  { path: 'issueType', select: 'name icon' },
  { path: 'changeType', select: 'name icon'  },
  { path: 'impact', select: 'name icon'  },
  { path: 'priority', select: 'name icon'  },
  { path: 'status', select: 'name icon'  },
  { path: 'changeReason', select: 'name icon'  },
  { path: 'investigationReason', select: 'name icon' },
  { path: 'files', select: 'name fileType extension thumbnail eTag' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

this.settingFields = "name slug icon";

exports.getTicket = async (req, res, next) => {
  try{
    const result = await this.dbservice.getObjectById(Ticket, this.fields, req.params.id, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};


const getCountsByGroups = async () => {
  const pipeline = [
    { $match: { isArchived: false, isActive: true } },
    {
      $facet: {
        byChangeReasons: [
          { $group: { _id: "$changeReason", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byChangeTypes: [
          { $group: { _id: "$changeType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byImpacts: [
          { $group: { _id: "$impact", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byInvestigationReasons: [
          { $group: { _id: "$investigationReason", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byIssueTypes: [
          { $group: { _id: "$issueType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byPriorities: [
          { $group: { _id: "$priority", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byStatuses: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      },
    },
  ];

  const result = await Ticket.aggregate(pipeline);
  return result;
};

exports.getTicketSettings = async (req, res, next) => {
  try{

    this.query = req.query != "undefined" ? req.query : {};  
    this.orderBy = { name: 1 };  
    this.query.isActive = true;
    this.query.isArchived = false;

    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    const changeReasons = await this.dbservice.getObjectList(req, TicketChangeReason, this.settingFields, this.query, this.orderBy );
    const changeTypes = await this.dbservice.getObjectList(req, TicketChangeType, this.settingFields, this.query, this.orderBy );
    const impacts = await this.dbservice.getObjectList(req, TicketImpact, this.settingFields, this.query, this.orderBy );
    const investigationReasons = await this.dbservice.getObjectList(req, TicketInvestigationReason, this.settingFields, this.query, this.orderBy );
    const issueTypes = await this.dbservice.getObjectList(req, TicketIssueType, this.settingFields, this.query, this.orderBy );
    const priorities = await this.dbservice.getObjectList(req, TicketPriority, this.settingFields, this.query, this.orderBy );
    const statuses = await this.dbservice.getObjectList(req, TicketStatus, this.settingFields, this.query, this.orderBy );

    const result = {
      changeReasons,
      changeTypes,
      impacts,
      investigationReasons,
      issueTypes,
      priorities,
      statuses
    }

    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.getTickets = async (req, res, next) => {
  try{
    this.query = req.query != "undefined" ? req.query : {};  
    this.orderBy = { name: 1 };  
    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    let result = await this.dbservice.getObjectList(req, Ticket, this.fields, this.query, this.orderBy, this.populate);
    
    const countsResult = await getCountsByGroups();
    if(Array.isArray(result)){
      result = {
        data: result,
        groupCounts: countsResult
      }
    } else {
      result.groupCounts = countsResult
    }
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.searchTickets = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    const result = await this.dbservice.getObjectList(req, Ticket, this.fields, this.query, this.orderBy, this.populate );
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.postTicket = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if( !req.body?.loginUser?.userId ){
      return res.status(StatusCodes.BAD_REQUEST).send( "User not found!" );
    }

    if( !req.body.reporter ){
      const userData = await this.dbservice.getObjectById( SecurityUser, this.fields, req.body?.loginUser?.userId );
      req.body.reporter = userData?.contact;
    }
    
    let ticketData = await getDocFromReq(req, 'new')
    const nextTicketNumber = await CounterController.getPaddedCounterSequence('supportTicket');
    ticketData.ticketNo = nextTicketNumber;
    ticketData = await this.dbservice.postObject(ticketData);
    req.params.ticketId = ticketData?._id;

    try {
      await ticketFileController.saveTicketFiles(req);
    } catch (error) {
      if (ticketData) {
        await Ticket.deleteObjectById(ticketData._id);
      }
      throw new Error("Failed to complete the ticket creation process: " + error.message);
    }
    return res.status(StatusCodes.ACCEPTED).json(ticketData);;
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.patchTicket = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    const oldObj = await this.dbservice.getObjectById( Ticket, this.fields, req.params.id );
    await this.dbservice.patchObject(Ticket, req.params.id, getDocFromReq(req));
     const fields = [ "reporter", "assignee", "priority", "status" ];
    const changedFields = {};

    fields.forEach((field) => {
      if( req.body?.[field] && req.body?.[field] !== oldObj?.[field] ){
        const newField = sentenceCase(field);
        changedFields[`previous${newField}`] = oldObj?.[field];
        changedFields[`new${newField}`] = req.body?.[field];
      }
    });

    if( Object.keys( changedFields ).length > 0 ){
      changedFields.loginUser = req.body?.loginUser
      changedFields.ticket = req.params.id
      console.log(" changedFields : ",changedFields)
      await ticketChangeController.postTicketChange( changedFields );
    }

    await ticketFileController.saveTicketFiles( req );

    return res.status(StatusCodes.ACCEPTED).send("Ticket updated successfully!");
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.deleteTicket = async (req, res, next) => {
  try{
    await this.dbservice.deleteObject( Ticket, req.params.id, res );
    return res.status(StatusCodes.BAD_REQUEST).send("Ticket deleted successfully!");
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

function getDocFromReq(req, reqType){
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new Ticket({}) : {};

  const allowedFields = [
    "customer", "machine", "issueType", "description", "summary", "changeType", "reporter",
    "impact", "priority", "status", "changeReason", "implementationPlan", "assignee",
    "backoutPlan", "testPlan", "components", "groups", "shareWith", "investigationReason",
    "rootCause", "workaround", "plannedStartDate", "plannedEndDate", "isActive", "isArchived"
  ];

  allowedFields.forEach((f) => {
    if (f in req.body) {
      doc[f] = req.body[f];
    }
  });

  if (reqType == "new" && "loginUser" in req.body ){
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