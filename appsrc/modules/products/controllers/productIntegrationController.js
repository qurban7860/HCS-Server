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

const { ProductIntegrationRecord } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

exports.getIntegrationRecord = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    
    const integrationRecord = await ProductIntegrationRecord.findOne({ machine: machineId });
    if (!integrationRecord) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "No existing record found" });
    }
    
    res.status(StatusCodes.OK).json({ MachineIntegrationRecord: integrationRecord });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postIntegrationRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const { machineId } = req.params;
    const existingRecord = await ProductIntegrationRecord.findOne({ machine: machineId });

    let doc;
    if (!existingRecord) {
      doc = getDocumentFromReq(req, 'new');
    } else {
      doc = getDocumentFromReq(req, 'update');
      doc = { ...existingRecord.toObject(), ...doc };
    }

    const result = await ProductIntegrationRecord.findOneAndUpdate(
      { machine: machineId },
      doc,
      { new: true, upsert: true }
    );

    res.status(StatusCodes.CREATED).json({ MachineIntegrationRecord: result });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};


function getDocumentFromReq(req, reqType){
  const { portalKey, machineSerialNo, computerGUID, IPC_SerialNo, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductIntegrationRecord({});
  }
  
    doc.machine = req.params.machineId;

  if ("portalKey" in req.body && "machineSerialNo" in req.body){
    doc.portalKey = portalKey;
    doc.machineSerialNo = machineSerialNo;
  }

  if ("computerGUID" in req.body){
    doc.computerGUID = computerGUID;
  }

  if ("IPC_SerialNo" in req.body){
    doc.IPC_SerialNo = IPC_SerialNo;
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

  //console.log("doc in http req: ", doc);
  return doc;

}