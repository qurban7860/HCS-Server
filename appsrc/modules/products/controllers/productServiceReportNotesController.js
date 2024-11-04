const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceReportNotes } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  { path: 'serviceReportID', select: 'serviceReportDate serviceReportUID' },
  { path: 'primaryServiceReportId', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];


exports.getProductServiceReportNote = async (req, res, next) => {
    try{
        await this.dbservice.getObjectById( ProductServiceReportNotes, this.fields, req.params.id, this.populate );

    } catch(error){
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send( error?.message || "Note not found!" );
    }
};

exports.getProductServiceReportNotes = async (req, res, next) => {
    try{
        this.machineId = req.params.machineId;
        this.query = req.query != "undefined" ? req.query : {};
        if(this.query.orderBy) {
          this.orderBy = this.query.orderBy;
          delete this.query.orderBy;
        }
        this.query.machine = this.machineId;

        const response = await this.dbservice.getObjectList(req, ProductServiceReportNotes, this.fields, this.query, this.orderBy, this.populate);
        res.json(response);
    } catch(error){
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Note List get failed!");
    }
};

exports.searchProductServiceReportNotes = async (req, res, next) => {
    try{
        this.query = req.query != "undefined" ? req.query : {};  
        const response = this.dbservice.getObjectList(req, ProductServiceReportNotes, this.fields, this.query, this.orderBy, this.populate );
        res.json(response);
    } catch ( error ){
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "search Note failed!");
    }
};

exports.deleteProductServiceReportNote = async (req, res, next) => {
    try{
        await this.dbservice.deleteObject(ProductServiceReportNotes, req.params.id, res,);
        res.status(StatusCodes.OK).send("Note Deleted Successfully!");
    } catch(e){
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Delete Note failed!");
    }
};

exports.postProductServiceReportNote = async (req, res, next) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
        const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
        res.status(StatusCodes.CREATED).json(response);
    } catch(error){
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Create Note failed!");
    }
};

exports.patchProductServiceReportNote = async (req, res, next) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        } 
        await this.dbservice.patchObject(ProductServiceReportNotes, req.params.id, getDocumentFromReq(req));
        const response = await this.dbservice.getObjectById( ProductServiceReportNotes, this.fields, req.params.id, this.populate );
        res.status(StatusCodes.ACCEPTED).send(response);
    } catch(error){
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Update Note failed!");
    }
};


function getDocumentFromReq(req, reqType){
  const { note, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceReportNotes({});
  }

  if ("note" in req.body){
    doc.note = note;
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

  return doc;

}
