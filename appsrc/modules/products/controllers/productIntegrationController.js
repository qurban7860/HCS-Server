const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require("http-status-codes");

const HttpError = require("../../config/models/http-error");
const logger = require("../../config/logger");
let rtnMsg = require("../../config/static/static");
const { integrationDetailsSchema } = require("../validations/ProductIntegrationValidations");

let productDBService = require("../service/productDBService");
this.dbservice = new productDBService();
const clients = new Map();

const { Product } = require("../models");
const APILog = require("../../apiclient/models/apilog");

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

exports.getIntegrationDetails = async (req, res, next) => {
  try {
    const { machineId } = req.params;

    const machine = await Product.findById(machineId).select('portalKey computerGUID IPC_SerialNo machineIntegrationSyncStatus');
    
    if (!machine) {
      return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      portalKey: machine.portalKey,
      computerGUID: machine.computerGUID,
      IPC_SerialNo: machine.IPC_SerialNo,
      machineIntegrationSyncStatus: machine.machineIntegrationSyncStatus
    });

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};


exports.postIntegrationPortalKey = async (req, res, next) => {
  const startTime = Date.now();
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

    if (machine.portalKey?.length > 0 && machine.machineIntegrationSyncStatus?.syncStatus) {
      machine.machineIntegrationSyncStatus = {
        syncStatus: false,
        syncDate: null,
        syncIP: null
      };
      await machine.save();
    }

    await machine.addPortalKey({
      key: portalKey,
      createdIP: req?.body?.loginUser?.userIP,
      createdBy: req?.body?.loginUser?.userId,
    });

    const updatedMachine = await Product.findById(machineId);

    broadcastIntegrationDetails(machineId, {
      computerGUID: updatedMachine?.machinecomputerGUID,
      IPC_SerialNo: updatedMachine?.IPC_SerialNo,
      portalKey: updatedMachine?.portalKey,
      machineIntegrationSyncStatus: updatedMachine?.machineIntegrationSyncStatus,
    });

    res.status(StatusCodes.CREATED).json({
      portalKey: updatedMachine.portalKey, 
      syncStatus: updatedMachine.machineIntegrationSyncStatus
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};

exports.postIntegrationDetails = async (req, res, next) => {
  const startTime = Date.now();
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
    
    const result = await machine.save();
    broadcastIntegrationDetails(machineId, {
      computerGUID: result.computerGUID,
      IPC_SerialNo: result.IPC_SerialNo,
      portalKey: result.portalKey,
      machineIntegrationSyncStatus: result.machineIntegrationSyncStatus,
    });

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
  const startTime = Date.now();
  const clientIP = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logApiCall({
        req,
        startTime,
        responseData: {
          statusCode: StatusCodes.BAD_REQUEST,
          body: getReasonPhrase(StatusCodes.BAD_REQUEST),
          context: "Validation Failed",
        },
        createdIP: clientIP,
      });
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const { machineSerialNo, howickPortalKey, computerGUID, IPCSerialNo } = req.body;

    const machine = await Product.findOne({
      serialNo: machineSerialNo,
      isActive: true,
      isArchived: false,
    }).populate("status");

    if (!machine || machine?.status?.name === "Transferred" || machine?.status?.name === "Decommissioned") {
      await logApiCall({
        req,
        startTime,
        responseData: {
          statusCode: StatusCodes.NOT_FOUND,
          body: getReasonPhrase(StatusCodes.NOT_FOUND),
          context: "Machine not found or has been transferred or decommissioned",
        },
        machine,
        createdIP: clientIP,
      });
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Machine not found or has been transferred or decommissioned" });
    }

    const latestPortalKey = machine.portalKey[0]?.key;

    if (!latestPortalKey || latestPortalKey !== howickPortalKey) {
      await logApiCall({
        req,
        startTime,
        responseData: {
          statusCode: StatusCodes.UNAUTHORIZED,
          body: getReasonPhrase(StatusCodes.UNAUTHORIZED),
          context: "Invalid portal key",
        },
        machine,
        createdIP: clientIP,
      });
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid portal key" });
    }

    if (!machine.computerGUID || !machine.IPC_SerialNo) {
      machine.computerGUID = computerGUID;
      machine.IPC_SerialNo = IPCSerialNo;
      machine.machineIntegrationSyncStatus = {
        syncStatus: true,
        syncDate: new Date(),
        syncIP: clientIP,
      };
      await machine.save();
      broadcastIntegrationDetails(machine._id, {
        computerGUID: computerGUID,
        IPC_SerialNo: IPCSerialNo,
        portalKey: machine.portalKey,
        machineIntegrationSyncStatus: {
          syncStatus: true,
          syncDate: new Date(),
          syncIP: clientIP,
        }
      });
      await logApiCall({
        req,
        startTime,
        responseData: {
          statusCode: StatusCodes.OK,
          body: getReasonPhrase(StatusCodes.OK),
          context: "Machine connection synced successfully and machine details saved",
        },
        machine,
        createdIP: clientIP,
      });
      return res.status(StatusCodes.OK).json({ message: "Machine connection synced successfully and machine details saved" });
    }

    if (machine.computerGUID === computerGUID && machine.IPC_SerialNo === IPCSerialNo) {
      if (!machine.machineIntegrationSyncStatus?.syncStatus) {
        machine.machineIntegrationSyncStatus = {
          syncStatus: true,
          syncDate: new Date(),
          syncIP: clientIP,
        };
        await machine.save();
      }
      broadcastIntegrationDetails(machine._id, {
        computerGUID: computerGUID,
        IPC_SerialNo: IPCSerialNo,
        portalKey: machine.portalKey,
        machineIntegrationSyncStatus: !machine.machineIntegrationSyncStatus?.syncStatus
          ? {
              syncStatus: true,
              syncDate: new Date(),
              syncIP: clientIP,
            }
          : machine.machineIntegrationSyncStatus,
      });
      await logApiCall({
        req,
        startTime,
        responseData: {
          statusCode: StatusCodes.OK,
          body: getReasonPhrase(StatusCodes.OK),
          context: "Machine connection verified successfully",
        },
        machine,
        createdIP: clientIP,
      });
      return res.status(StatusCodes.OK).json({ message: "Machine connection verified successfully" });
    }

    await logApiCall({
      req,
      startTime,
      responseData: {
        statusCode: StatusCodes.CONFLICT,
        body: getReasonPhrase(StatusCodes.CONFLICT),
        context: "Machine connection details mismatch",
      },
      machine,
      createdIP: clientIP,
    });
    return res.status(StatusCodes.CONFLICT).json({ message: "Machine connection details mismatch" });
  } catch (error) {
    await logApiCall({
      req,
      startTime,
      responseData: {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        body: error.toString(),
        context: "Machine Sync Error",
        createdIP: clientIP,
      },
    });
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};

exports.streamMachineIntegrationStatus = async (req, res) => {
  const machineId = req.params.machineId;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const clientId = req.body.loginUser.userId + '_' + machineId;
  
  clients.set(clientId, res);
  
  req.on('close', () => {
      clients.delete(clientId);
  });
};

function broadcastIntegrationDetails(machineId, integrationDetails) {
  clients.forEach((client, clientId) => {
      if (clientId.includes(machineId)) {
          client.write(`data: ${JSON.stringify(integrationDetails)}\n\n`);
      }
  });
}

const logApiCall = async ({ req, startTime, responseData, machine = null, createdIP, createdBy }) => {
  const apiLog = new APILog({
    requestMethod: req.method,
    requestURL: req.originalUrl,
    requestHeaders: req.headers,
    machine: machine ? [machine._id] : [],
    customer: machine?.customer,
    apiType: "MACHINE-INTEGRATION",
    responseTime: `${Date.now() - startTime}`,
    response: JSON.stringify(responseData.body),
    responseStatusCode: responseData.statusCode,
    additionalContextualInformation: responseData.context,
    createdIP: req?.body?.loginUser?.userIP || createdIP,
    createdBy: req?.body?.loginUser?.userId || createdBy || null,
  });
  return apiLog.save();
};
