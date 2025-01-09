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
  { path: 'reporter', select: 'firstName lastName' },
  { path: 'assignee', select: 'firstName lastName' },
  { path: 'priority', select: 'name icon'  },
  { path: 'status', select: 'name icon'  },
  { path: 'updatedBy', select: 'name' }
];


exports.getTicketHistory = async (req, res, next) => {
  try{
    const result = await this.dbservice.getObjectById( TicketChangeHistory, this.fields, req.params.id, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.getTicketHistories = async (req, res, next) => {
  try{
    this.query = req.query != "undefined" ? req.query : {};  
    this.orderBy = { name: 1 };  
    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    let result = await this.dbservice.getObjectList(req, TicketChangeHistory, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.postTicketChange = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    const result = await this.dbservice.postObject(getDocFromReq( req ));
    return res.status(StatusCodes.ACCEPTED).json(result);;
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

function getDocFromReq( req ){
  const { loginUser } = req.body;
  const doc = new TicketChangeHistory({});
  const allowedFields = [ 
    "ticket", 
    "previousReporter", 
    "newReporter", 
    "previousAssignee", 
    "newAssignee", 
    "previousPriority", 
    "newPriority", 
    "previousStatus", 
    "newStatus"
  ];

  allowedFields.forEach((f) => {
    if (f in req.body){
      doc[f] = req.body[f];
    }
  });

  if ("loginUser" in req.body ){
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }

  return doc;
}