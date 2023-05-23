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

const { ProductConnection, Product } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };    
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];


exports.connectMachine = async (req, res, next) => {
  let machineId = req.body.machineId;
  let connectedMachineId = req.body.connectedMachineId;
  let dbMachine = await this.dbservice.getObjectById(Product, this.fields, machineId);
  let connectedMachine = await this.dbservice.getObjectById(Product, this.fields, connectedMachineId);
  
  if(!dbMachine || !connectedMachine) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  let machineConnection = await this.dbservice.getObject(ProductConnection, { machine:machine.id, connectedMachine : connectedMachine.id});
  if(!machineConnection) {
    let machineConnection = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
    
    if(machineConnection && machineConnection.id) {
      
      let machine = await this.dbservice.patchObject(Product, dbMachine.id, { $addToSet:{machineConnections:connectedMachine} });
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, machine));

    }
    else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));    
    }
  }
  else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));    

  }

};

exports.disconnectMachine = async (req, res, next) => {
  let machineId = req.body.machineId;
  let connectedMachineId = req.body.connectedMachineId;
  let dbMachine = await this.dbservice.getObjectById(Product, this.fields, machineId);
  let connectedMachine = await this.dbservice.getObjectById(Product, this.fields, connectedMachineId);
  if(!dbMachine || !connectedMachine) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  let machineConnection = await this.dbservice.getObject(ProductConnection, { machine:machine.id, connectedMachine : connectedMachine.id});
  if(machineConnection && machineConnection.id) {
    machineConnection.disconnectionDate = new Date();
    machineConnection = await this.dbservice.patchObject(machineConnection);
    await this.dbservice.patchObject(Product, dbMachine.id, { $pull:{machineConnections:connectedMachine} });
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, machine));
  }
  else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));    
  }
};

function getDocumentFromReq(req, reqType){
  const { machine, connectedMachine, note, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductConnection({});
  }

  if ("machine" in req.body){
    doc.machine = machine;
  }
  
  if ("note" in req.body){
    doc.note = note;
  }

  if ("connectedMachine" in req.body){
    doc.connectedMachine = connectedMachine;
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
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}
