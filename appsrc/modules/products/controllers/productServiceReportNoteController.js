const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
const clients = new Map();
let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceReportNote, ProductServiceReports } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = { isActive: true, isArchived: false };
this.orderBy = { createdAt: -1 };  
this.populate = [
  { path: 'serviceReport', select: 'isActive' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

var serviceNotes = new Set([ 
  "technicianNotes", 
  "serviceNote", 
  "recommendationNote", 
  "internalComments", 
  "suggestedSpares", 
  "internalNote", 
  "operatorNotes"
]);

const getServiceReportNote = async ( noteId ) => {
  try{
    const note = await this.dbservice.getObjectById(ProductServiceReportNote, this.fields, noteId, this.populate );
    return note;
  } catch( error ){
    logger.error(new Error(error));
    throw new Error(error)
  }
}

exports.getProductServiceReportNote = async (req, res, next) => {
  try{
    const response = await getServiceReportNote( req.params.id )
    res.json(response);
  } catch ( error ){
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Note get failed!");
  }
}

exports.getProductServiceReportNotes = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    this.query.serviceReportId = req.params.serviceReportId;
    this.query.isActive = true;
    this.query.isArchived = false;

    const response = await this.dbservice.getObjectList(req, ProductServiceReportNote, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Notes List get failed!");
  }
};

const newReportNotesHandler = async ( req ) => {
  try {

    const serviceReport = req.params.serviceReportId;
    const savedNoteIds = {};
    for (const field in req.body) {
      const noteValue = req.body[field];

      if ( serviceNotes?.has(field) && field !== "loginUser" && typeof noteValue === "string" && noteValue?.trim() ) {
         
            await ProductServiceReportNote.updateMany( { type: field, serviceReport }, { $set: { isHistory: true } } );

            const noteData = {
              body:{
                type: field,
                note: noteValue.trim(),
                loginUser: req.body.loginUser,
                serviceReport,
              }
            };
            if(field === "operatorNotes" && req.body?.operators){
              noteData.body.operators = req.body?.operators;
            }
            if(field === "technicianNotes" && req.body?.technician ){
              noteData.body.technician = req.body.technician;
            }

            const savedNote = await this.dbservice.postObject(getDocumentFromReq(noteData, "new"));

            savedNoteIds[field] = savedNote._id;
            delete req.body[field];
        }
    }

    let updateOperations = {};
    for (const [field, noteId] of Object.entries(savedNoteIds)) {
        updateOperations[field] = { $each: [noteId], $position: 0 };
    }

    await this.dbservice.patchObject(ProductServiceReports, serviceReport, { $push: updateOperations });
    const [firstKey, firstValue] = Object.entries(savedNoteIds || {})[0] || [];
    return firstValue
  } catch (error) {
    logger.error(new Error(error));
    throw new Error(error)
  }
}

exports.newReportNotesHandler = newReportNotesHandler;

exports.postProductServiceReportNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    
    const note = await newReportNotesHandler( req );
    console.log("note : ",note)
    const response = await getServiceReportNote( note )
    res.status(StatusCodes.ACCEPTED).json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Add Note failed!");
  }
};

exports.patchProductServiceReportNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    // const existingNote = await this.dbservice.getObjectById(ProductServiceReportNote, {}, req.params.id, this.populate);
    // if (existingNote.createdBy._id.toString() !== req.body.loginUser.userId) {
    //   return res.status(StatusCodes.FORBIDDEN).send("Only the note author can modify this Note");
    // }

    await this.dbservice.patchObject(ProductServiceReportNote, req.params.id, getDocumentFromReq(req));
    // this.serviceReportId = req.params.serviceReportId;
    // this.query = { serviceReportId: this.serviceReportId, isActive: true, isArchived: false };
    // const NotesList = await this.dbservice.getObjectList(req, ProductServiceReportNote, this.fields, this.query, this.orderBy, this.populate);
    
    // broadcastNotes(this.serviceReportId, NotesList);
    // res.status(StatusCodes.ACCEPTED).json({ updatedNote: response, NotesList });

    const response = await getServiceReportNote( req.params.id )
    res.status(StatusCodes.ACCEPTED).json( response );
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Update Note failed!");
  }
};

exports.deleteProductServiceReportNote = async (req, res, next) => {
  try {
    const existingNote = await this.dbservice.getObjectById(ProductServiceReportNote, {}, req.params.id, this.populate);

    if (existingNote.createdBy._id.toString() !== req.body.loginUser.userId) {
      return res.status(StatusCodes.FORBIDDEN).send("Only the Note author can delete this Note");
    }

    await this.dbservice.patchObject(ProductServiceReportNote, req.params.id, getDocumentFromReq(req, "delete"));

    // this.serviceReportId = req.params.serviceReportId;
    // this.query = { serviceReportId: this.serviceReportId, isActive: true, isArchived: false };
    // const NotesList = await this.dbservice.getObjectList(req, ProductServiceReportNote, this.fields, this.query, this.orderBy, this.populate);

    // await this.dbservice.deleteObject(ProductServiceReportNote, req.params.id, res,);
    // broadcastNotes(this.serviceReportId, NotesList);
    // res.status(StatusCodes.OK).json({ NotesList });
    res.status(StatusCodes.OK).send("Note deleted successfully!");
  } catch (e) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Delete Note failed!");
  }
};

exports.streamProductServiceReportNotes = async (req, res) => {
  const serviceReportId = req.params.serviceReportId;
  
  // res.writeHead(200, {
  //     'Content-Type': 'text/event-stream',
  //     'Cache-Control': 'no-cache',
  //     'Connection': 'keep-alive'
  // });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const clientId = req.body.loginUser.userId + '_' + serviceReportId;
  
  clients.set(clientId, res);
  
  req.on('close', () => {
      clients.delete(clientId);
  });
};

function broadcastNotes(serviceReportId, Notes) {
  clients.forEach((client, clientId) => {
      // console.log("clientId in loop: ", clientId);
      if (clientId.includes(serviceReportId)) {
          // console.log("clientId before streaming Data: ", clientId);
          client.write(`data: ${JSON.stringify(Notes)}\n\n`);
      }
  });
}


function getDocumentFromReq(req, reqType){
  const { note, serviceReport, type, technician, operators, isActive, isArchived, loginUser } = req.body;
  
  let doc = {};

  if (reqType && reqType == "new"){
    doc = new ProductServiceReportNote({});
  }

  if ("type" in req.body){
    doc.type = type;
  }

  if ("note" in req.body){
    doc.note = note;
  }

  if ("serviceReport" in req.body){
    doc.serviceReport = serviceReport;
  }

  if ("technician" in req.body){
    doc.technician = technician;
  }

  if ("operators" in req.body){
    doc.operators = operators;
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
