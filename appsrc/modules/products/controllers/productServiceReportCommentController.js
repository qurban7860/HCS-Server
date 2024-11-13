const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');

const logger = require('../../config/logger');
const clients = new Map();

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceReportComment } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = { isActive: true, isArchived: false };
this.orderBy = { createdAt: -1 };  
this.populate = [
  { path: 'serviceReportId', select: '_id' },
  { path: 'primaryServiceReportId', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getProductServiceReportComments = async (req, res, next) => {
  try {
    this.primaryServiceReportId = req.params.primaryServiceReportId;
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.query.primaryServiceReportId = this.primaryServiceReportId;
    this.query.isActive = true;
    this.query.isArchived = false;

    const response = await this.dbservice.getObjectList(req, ProductServiceReportComment, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Comment List get failed!");
  }
};

exports.postProductServiceReportComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    
    const response = await this.dbservice.postObject(getDocumentFromReq(req, "new"));

    this.primaryServiceReportId = req.params.primaryServiceReportId;
    this.query = { primaryServiceReportId: this.primaryServiceReportId, isActive: true, isArchived: false };
    const commentsList = await this.dbservice.getObjectList(req, ProductServiceReportComment, this.fields, this.query, this.orderBy, this.populate);

    broadcastComments(this.primaryServiceReportId, commentsList);
    res.status(StatusCodes.CREATED).json({ newComment: response, commentsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Add Comment failed!");
  }
};

exports.patchProductServiceReportComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const existingComment = await this.dbservice.getObjectById(ProductServiceReportComment, {}, req.params.id, this.populate);
    if (existingComment.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the comment author can modify this comment");
    }

    const response = await this.dbservice.patchObject(ProductServiceReportComment, req.params.id, getDocumentFromReq(req));

    this.primaryServiceReportId = req.params.primaryServiceReportId;
    this.query = { primaryServiceReportId: this.primaryServiceReportId, isActive: true, isArchived: false };
    const commentsList = await this.dbservice.getObjectList(req, ProductServiceReportComment, this.fields, this.query, this.orderBy, this.populate);

    broadcastComments(this.primaryServiceReportId, commentsList);
    res.status(StatusCodes.ACCEPTED).json({ updatedComment: response, commentsList });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Update Comment failed!");
  }
};

exports.deleteProductServiceReportComment = async (req, res, next) => {
  try {
    const existingComment = await this.dbservice.getObjectById(ProductServiceReportComment, {}, req.params.id, this.populate);

    if (existingComment.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the comment author can delete this comment");
    }

    await this.dbservice.patchObject(ProductServiceReportComment, req.params.id, getDocumentFromReq(req, "delete"));

    this.primaryServiceReportId = req.params.primaryServiceReportId;
    this.query = { primaryServiceReportId: this.primaryServiceReportId, isActive: true, isArchived: false };
    const commentsList = await this.dbservice.getObjectList(req, ProductServiceReportComment, this.fields, this.query, this.orderBy, this.populate);

    // await this.dbservice.deleteObject(ProductServiceReportComment, req.params.id, res,);
    broadcastComments(this.primaryServiceReportId, commentsList);
    res.status(StatusCodes.OK).json({ commentsList });
  } catch (e) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Delete Comment failed!");
  }
};

exports.streamProductServiceReportComments = async (req, res) => {
  const primaryServiceReportId = req.params.primaryServiceReportId;
  
  // res.writeHead(200, {
  //     'Content-Type': 'text/event-stream',
  //     'Cache-Control': 'no-cache',
  //     'Connection': 'keep-alive'
  // });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const clientId = req.body.loginUser.userId + '_' + primaryServiceReportId;
  
  clients.set(clientId, res);
  
  req.on('close', () => {
      clients.delete(clientId);
  });
};

function broadcastComments(primaryServiceReportId, comments) {
  clients.forEach((client, clientId) => {
      if (clientId.includes(primaryServiceReportId)) {
          client.write(`data: ${JSON.stringify(comments)}\n\n`);
      }
  });
}


function getDocumentFromReq(req, reqType){
  const { comment, isActive, isArchived, loginUser, serviceReportId, primaryServiceReportId } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceReportComment({});
  }

  if ("comment" in req.body){
    doc.comment = comment;
  }
  if ("serviceReportId" in req.body){
    doc.serviceReportId = serviceReportId;
  }
  if ("primaryServiceReportId" in req.body){
    doc.primaryServiceReportId = primaryServiceReportId;
  }

  if ("isActive" in req.body){
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }

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
