const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const LZString = require('lz-string');
const logger = require('../../config/logger');
let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const clients = new Map();
const { ProductNote } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];


exports.getProductNote = async (req, res, next) => {
  this.dbservice.getObjectById(ProductNote, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductNotes = async (req, res, next) => {
  try {
    this.machine = req.params.machineId;
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.query.machine = this.machine;
    const response = await this.dbservice.getObjectList(req, ProductNote, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Notes Fetch Failed!");
  }
};

exports.searchProductNotes = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.dbservice.getObjectList(req, ProductNote, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductNote = async (req, res, next) => {
  try {
    const existingNote = await this.dbservice.getObjectById(ProductNote, {}, req.params.id, this.populate);

    if (existingNote.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the note author can delete this note");
    }

    if (!existingNote.isArchived) {
      return res.status(StatusCodes.FORBIDDEN).send("Record cannot be deleted. It should be archived first!");
    }

    await this.dbservice.deleteObject(ProductNote, req.params.id, res);

    this.machine = req.params.machineId;
    this.query = { machine: this.machine, isActive: true, isArchived: false };
    const notesList = await this.dbservice.getObjectList(req, ProductNote, this.fields, this.query, this.orderBy, this.populate);

    broadcastNotes(this.machine, notesList);
    res.status(StatusCodes.OK).json({ notesList });
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Delete Note failed!");
  }
};

exports.postProductNote = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
  const response = await this.dbservice.postObject(getDocumentFromReq(req, "new"));

  this.machine = req.params.machineId;
  this.query = { machine: this.machine, isActive: true, isArchived: false };
  const notesList = await this.dbservice.getObjectList(req, ProductNote, this.fields, this.query, this.orderBy, this.populate);

  broadcastNotes(this.machine, notesList);
  res.status(StatusCodes.CREATED).json({ newNote: response, notesList });
};

exports.patchProductNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const existingNote = await this.dbservice.getObjectById(ProductNote, {}, req.params.id, this.populate);
    if (existingNote.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the note author can modify this note");
    }

    const response = await this.dbservice.patchObject(ProductNote, req.params.id, getDocumentFromReq(req));

    this.machine = req.params.machineId;
    this.query = { machine: this.machine, isActive: true, isArchived: false };
    const notesList = await this.dbservice.getObjectList(req, ProductNote, this.fields, this.query, this.orderBy, this.populate);

    broadcastNotes(this.machine, notesList);
    res.status(StatusCodes.ACCEPTED).json({ updatedNote: response, notesList });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message || "Note update failed!");
  }
};

exports.streamProductNotes = async (req, res) => {
  const machine = req.params.machineId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = req.body.loginUser.userId + '_' + machine;

  clients.set(clientId, res);

  req.on('close', () => {
    clients.delete(clientId);
  });
};

function broadcastNotes(machine, notes) {
  const jsonString = JSON.stringify(notes);
  const compressed = LZString.compressToUTF16(jsonString);
  clients.forEach((client, clientId) => {
    if (clientId.includes(machine)) {
      client.write(`data: ${compressed}\n\n`);
    }
  });
}

function getDocumentFromReq(req, reqType) {
  const { note, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new ProductNote({});
  }

  doc.machine = req.params.machineId;

  if ("note" in req.body) {
    doc.note = note;
  }


  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body) {
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
