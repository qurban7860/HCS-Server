const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();
const _ = require('lodash');
const { Ticket } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'customer', select: 'name'},
  {path: 'machine', select: 'serialNo name'},
  {path: 'files', select: 'name'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];


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
        byIssueType: [
          { $group: { _id: "$issueType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byType: [
          { $group: { _id: "$changeType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byPriority: [
          { $group: { _id: "$priority", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      },
    },
  ];

  const result = await Ticket.aggregate(pipeline);
  return result;
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
    const result = await this.dbservice.postObject(getDocFromReq(req, 'new'));
    return res.status(StatusCodes.ACCEPTED).json(result);;
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
    const result = await this.dbservice.patchObject(Ticket, req.params.id, getDocFromReq(req));
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
    "customer", "machine", "issueType", "description", "summary", "changeType",
    "impact", "priority", "status", "files", "changeReason", "implementationPlan",
    "backoutPlan", "testPlan", "components", "groups", "shareWith", "investigationReason",
    "rootCause", "workaround", "plannedStartDate", "plannedEndDate", "isActive", "isArchived"
  ];

  allowedFields.forEach((field) => {
    if (field in req.body) {
      doc[field] = req.body[field];
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