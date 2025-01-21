const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();
const _ = require('lodash');
const { Ticket, TicketInvestigationReason } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];


exports.getTicketInvestigationReason = async (req, res, next) => {
  try{
    const result = await this.dbservice.getObjectById(TicketInvestigationReason, this.fields, req.params.id, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.getTicketInvestigationReasons = async (req, res, next) => {
  try{
    this.query = req.query != "undefined" ? req.query : {};  
    this.orderBy = { name: 1 };  
    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    const result = await this.dbservice.getObjectList(req, TicketInvestigationReason, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.searchTicketInvestigationReasons = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    const result = await this.dbservice.getObjectList(req, TicketInvestigationReason, this.fields, this.query, this.orderBy, this.populate );
    return res.status(StatusCodes.OK).json(result);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

const handleIsDefault = async ( req ) => {
  if( req.body.isDefault ){
    const isDefaultExist = await this.dbservice.getObject( TicketInvestigationReason, { isDefault: true, isArchived: false } );
    if( isDefaultExist?._id && req.params.id != isDefaultExist?._id ){
      throw new Error("Default investigation reason already exist!");
    }
  }
}

exports.postTicketInvestigationReason = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    await handleIsDefault( req );
    const result = await this.dbservice.postObject(getDocFromReq(req, 'new'));
    return res.status(StatusCodes.ACCEPTED).json(result);;
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.patchTicketInvestigationReason = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    await handleIsDefault( req );
    if ( req.body.isArchived || !req.body.isActive ) {
      this.query.investigationReason = req.params.id;
      this.query.isArchived = false;
      const result = await this.dbservice.getObject( Ticket, this.query );
      if( result?._id ){
        logger.info(new Error(errors));
        return res.status(StatusCodes.BAD_REQUEST).send( "Investigation Reason used in the Ticket can't be inactive or archived!" );
      }
    }
    await this.dbservice.patchObject(TicketInvestigationReason, req.params.id, getDocFromReq(req));
    return res.status(StatusCodes.ACCEPTED).send(`Investigation Reason ${ req.body?.isArchived ? "archived" : "updated" } successfully!`);
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

exports.deleteTicketInvestigationReason = async (req, res, next) => {
  try{
    await this.dbservice.deleteObject( TicketInvestigationReason, req.params.id, res );
    return res.status(StatusCodes.BAD_REQUEST).send("Investigation Reason deleted successfully!");
  } catch( error ){
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send( error?.message );
  }
};

function getDocFromReq(req, reqType){
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new TicketInvestigationReason({}) : {};

  const allowedFields = [ "name", "description", "slug", "displayOrderNo", "isDefault", "icon",  "color", "isActive", "isArchived" ];

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