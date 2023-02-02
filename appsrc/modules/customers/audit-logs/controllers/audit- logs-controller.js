const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { AuditLogs } = require('../models');
const logger = require('../../../config/logger');
let rtnMsg = require('../../../config/static/static')

let auditLogService = require('../service/audit-logs-service')
this.auditLogserv = new auditLogService();

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {}, this.query = {}, this.orderBy = { name: 1 }, this.populate = 'user';

exports.getAuditLog = async (req, res, next) => {
  this.auditLogserv.getObjectById(AuditLogs, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getAuditLogs = async (req, res, next) => {
  this.auditLogserv.getAuditLogs(AuditLogs, this.fields, this.query, this.orderBy, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteAuditLog = async (req, res, next) => {
  this.auditLogserv.deleteObject(AuditLogs, req.params.id, callbackFunc);
  console.log(req.params.id);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postAuditLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { 
      customer, site, contact, user, note, activityType, activitySummary,     
      activityDetail, createdBy, createdIP,} = req.body;
    const auditLogSchema = new AuditLogs({
      customer,     
      site,     
      contact,     
      user,     
      note,     
      activityType,     
      activitySummary,     
      activityDetail,     
      createdBy,     
      createdIP,
  });

    this.auditLogserv.postAuditLog(auditLogSchema, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ auditLogs: response });
      }
    }
  }
};

exports.patchAuditLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.auditLogserv.patchAuditLog(AuditLogs, req.params.id, req.body, callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};