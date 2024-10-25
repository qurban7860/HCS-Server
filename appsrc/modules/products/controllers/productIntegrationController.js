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

const { Product } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

// exports.getIntegrationRecord = async (req, res, next) => {
//   try {
//     const { machineId } = req.params;
    
//     const machine = await Product.findById(machineId);
//     if (!machine || !machine.portalKey?.length) {
//       return res.status(StatusCodes.NOT_FOUND).json({ message: "No existing record found" });
//     }
    
//     res.status(StatusCodes.OK).json({ 
//       MachineIntegrationRecord: {
//         machine: machineId,
//         portalKey: machine.currentPortalKey,
//         computerGUID: machine.computerGUID,
//         IPC_SerialNo: machine.IPC_SerialNo,
//         portalKeyHistory: machine.portalKey
//       }
//     });
//   } catch (error) {
//     logger.error(new Error(error));
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//   }
// };

exports.postIntegrationPortalKey = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const { machineId } = req.params;
    const { portalKey } = req.body;
    
    const machine = await Product.findById(machineId);
    if (!machine) {
      return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));
    }

    await machine.addPortalKey({
      key: portalKey,
      createdIP: req?.body?.loginUser?.userIP,
      createdBy: req?.body?.loginUser?.userId
    });
    const updatedMachine = await Product.findById(machineId);
    res.status(StatusCodes.CREATED).json(updatedMachine.portalKey);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};

exports.postIntegrationDetails = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const { machineId } = req.params;
    const { computerGUID, IPC_SerialNo } = req.body;
    
    const machine = await Product.findById(machineId);
    if (!machine) {
      return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));
    }

    machine.computerGUID = computerGUID;
    machine.IPC_SerialNo = IPC_SerialNo;

    // if (computerGUID) {
    //   machine.computerGUID = computerGUID;
    // }
    
    // if (IPC_SerialNo) {
    //   machine.IPC_SerialNo = IPC_SerialNo;
    // }
    
    const result = await machine.save();
    // const updatedMachine = await Product.findById(machineId);
    res.status(StatusCodes.CREATED).json({
      computerGUID: result.computerGUID,
      IPC_SerialNo: result.IPC_SerialNo
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};

exports.syncMachineConnection = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const { Machine_Serial_No, Howick_Portal_Key, Computer_GUID, IPC_Serial_No } = req.body;
    
    const machine = await Product.findOne({ serialNo: Machine_Serial_No });
    if (!machine) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Machine not found" });
    }

    const latestPortalKey = machine.portalKey[0]?.key;

    if (!latestPortalKey || latestPortalKey !== Howick_Portal_Key) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid portal key" });
    }

    if (!machine.computerGUID || !machine.IPC_SerialNo) {
      machine.computerGUID = Computer_GUID;
      machine.IPC_SerialNo = IPC_Serial_No;
      machine.machineIntegrationSyncStatus = true;
      await machine.save();
      return res.status(StatusCodes.OK).json({ message: "Machine connection synced successfully" });
    }

    if (machine.computerGUID === Computer_GUID && machine.IPC_SerialNo === IPC_Serial_No) {
      machine.machineIntegrationSyncStatus = true;
      await machine.save();
      return res.status(StatusCodes.OK).json({ message: "Machine connection verified successfully" });
    }

    return res.status(StatusCodes.CONFLICT).json({ message: "Machine connection details mismatch" });

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};
