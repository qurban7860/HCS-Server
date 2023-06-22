const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
const dbservice = new productDBService();

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

  let connectMachineResponse = await connectMachines(req.params.id, req.body.connectedMachineIds)
  
  if(connectMachineResponse && connectMachineResponse.id) {
    res.status(StatusCodes.OK).json(connectMachineResponse);
  }
  else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));    
  }

};

async function connectMachines(machineId, connectedMachines = []) {
  try{
    if(!mongoose.Types.ObjectId.isValid(machineId))
      return false;

    let dbMachine = await dbservice.getObjectById(Product, this.fields, machineId);
    
    if(!dbMachine || dbMachine.isActive==false || dbMachine.isArchived==true)
      return false;
    let connectedMachinesIds = []
    if(Array.isArray(connectedMachines) && connectedMachines.length>0) {
      for(let connectedMachineId of connectedMachines) {
        
        if(!mongoose.Types.ObjectId.isValid(connectedMachineId) || machineId==connectedMachineId)
          continue;
        
        let decoilerMachine = await dbservice.getObjectById(Product, this.fields, connectedMachineId);
        
        if(decoilerMachine && decoilerMachine.id && decoilerMachine.isActive && !decoilerMachine.isArchived) {
          let machineConnection = await dbservice.getObject(ProductConnection, { machine:machineId, connectedMachine : connectedMachineId, isActive:true});
          
          if(!machineConnection) {
            let machineConnectionData = {
              machine:dbMachine.id,
              connectedMachine:decoilerMachine.id
            }

            machineConnectionData = new ProductConnection(machineConnectionData);
            machineConnection = await dbservice.postObject(machineConnectionData);

            connectedMachinesIds.push(machineConnection.id);
          }
        }
      }
    }

    if(connectedMachinesIds && Array.isArray(connectedMachinesIds) && connectedMachinesIds.length>0) {
      let machineConnectionsDB = dbMachine.machineConnections;
      let machineConnectionsUnique = machineConnectionsDB.concat(connectedMachinesIds);
      machineConnectionsUnique = [...new Set(machineConnectionsUnique)]
      if(machineConnectionsUnique && machineConnectionsUnique.length>0) {
        dbMachine.machineConnections = machineConnectionsUnique;
        dbMachine = await dbMachine.save();
      }
      
      return dbMachine;
    }
    else {
      return false;
    }
  }catch(e) {
    console.log(e);
    return false;
  }
}


exports.connectMachines = connectMachines;


exports.disconnectMachine = async (req, res, next) => {
  let connectedMachineIds = req.body.connectedMachineIds;
  let disconnectMachineResponse = await disconnectMachine_(req.params.machineId, connectedMachineIds);
    
  if(disconnectMachineResponse && disconnectMachineResponse.id) {
    res.status(StatusCodes.OK).json(disconnectMachineResponse);
  }
  else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));    
  }
};

async function disconnectMachine_(machineId, machineConnections) {

  if(!mongoose.Types.ObjectId.isValid(machineId))
    return false;

  let dbMachine = await dbservice.getObjectById(Product, this.fields, machineId);

  if(!dbMachine || dbMachine.isActive==false || dbMachine.isArchived==true)
    return false;
  
  if(Array.isArray(machineConnections) && machineConnections.length>0) {
    for(let machineConnectionId of machineConnections) {

      if(!mongoose.Types.ObjectId.isValid(machineConnectionId) || machineId==machineConnectionId)
        continue;
        
      let machineConnections = dbMachine.machineConnections;
      let index = machineConnections.indexOf(machineConnectionId);
      
      if(index>-1) {
        machineConnections.splice(index, 1)
      }

      dbMachine.machineConnections = machineConnections;

      if(!mongoose.Types.ObjectId.isValid(machineConnectionId))
        continue;

      let updateValue = { disconnectionDate: new Date(),isActive:false };
      await dbservice.patchObject(ProductConnection, machineConnectionId, updateValue );
      
    }
  }
  else {
    return false;
  }
  
  return await dbMachine.save();

}

exports.disconnectMachine_ = disconnectMachine_;

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
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}
