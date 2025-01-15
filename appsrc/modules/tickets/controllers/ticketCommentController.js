const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const LZString = require('lz-string');
const logger = require('../../config/logger');
const clients = new Map();

let DBService = require('../service/ticketDBService')
this.dbservice = new DBService();

const { TicketComment } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = { isActive: true, isArchived: false };
this.orderBy = { createdAt: -1 };  
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getTicketComment = async (req, res, next) => {
  try{
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.query.ticket = req.params.ticketId;
      this.query._id = req.params.id;
    }
    const result = await this.dbservice.getObject(TicketComment, this.query, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.getTicketComments = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.query.ticket = req.params.ticketId;
    this.query.isActive = true;
    this.query.isArchived = false;

    const response = await this.dbservice.getObjectList(req, TicketComment, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Comment List get failed!");
  }
};

exports.postTicketComment = async (req, res, next) => {
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
    const commentsList = await this.dbservice.getObjectList(req, TicketComment, this.fields, this.query, this.orderBy, this.populate);

    broadcastComments(this.ticketId, commentsList);
    res.status(StatusCodes.CREATED).json({ newComment: response, commentsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Add Comment failed!");
  }
};

exports.patchTicketComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    req.body.ticket = req.params?.ticketId;
    
    const existingComment = await this.dbservice.getObjectById(TicketComment, {}, req.params.id, this.populate);
    if (existingComment.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the comment author can modify this comment");
    }

    const response = await this.dbservice.patchObject(TicketComment, req.params.id, getDocumentFromReq(req));

    this.ticketId = req.params.ticketId;
    this.query = { ticket: this.ticketId, isActive: true, isArchived: false };
    const commentsList = await this.dbservice.getObjectList(req, TicketComment, this.fields, this.query, this.orderBy, this.populate);

    broadcastComments(this.ticketId, commentsList);
    res.status(StatusCodes.ACCEPTED).json({ updatedComment: response, commentsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Update Comment failed!");
  }
};

exports.deleteTicketComment = async (req, res, next) => {
  try {
    const existingComment = await this.dbservice.getObjectById(TicketComment, {}, req.params.id, this.populate);

    if (existingComment.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the comment author can delete this comment");
    }

    await this.dbservice.patchObject(TicketComment, req.params.id, getDocumentFromReq(req, "delete"));

    this.ticketId = req.params.ticketId;
    this.query = { ticket: this.ticketId, isActive: true, isArchived: false };
    const commentsList = await this.dbservice.getObjectList(req, TicketComment, this.fields, this.query, this.orderBy, this.populate);

    broadcastComments(this.ticketId, commentsList);
    res.status(StatusCodes.OK).json({ commentsList });
  } catch ( error ) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Delete Comment failed!");
  }
};

exports.streamTicketComments = async (req, res) => {
  const ticket = req.params.ticketId;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const clientId = req.body.loginUser.userId + '_' + ticket;
  
  clients.set(clientId, res);
  
  req.on('close', () => {
      clients.delete(clientId);
  });
};

function broadcastComments(ticket, comments) {
  const jsonString = JSON.stringify(comments);
  const compressed = LZString.compressToUTF16(jsonString);
  clients.forEach((client, clientId) => {
      if (clientId.includes(ticket)) {
          client.write(`data: ${compressed}\n\n`);
      }
  });
}


function getDocumentFromReq(req, reqType){
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new TicketComment({}) : {};

  const allowedFields = [ "ticket", "comment", "isInternal", "isActive", "isArchived" ];

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
  if (reqType == "delete") {
    doc.isArchived = true;
    doc.isActive = false;
  }

  return doc;

}
