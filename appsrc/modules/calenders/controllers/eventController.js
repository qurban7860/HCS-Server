const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { render } = require('template-file');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const emailController = require('../../email/controllers/emailController');
let calenderDBService = require('../service/calenderDBService')
const EventEmailService = require('../service/eventEmailService')
this.dbservice = new calenderDBService();
const { filterAndDeduplicateEmails, verifyEmail, renderEmail } = require('../../email/utils');
const { fDateTime, fDate } = require('../../../../utils/formatTime');
const { processFile } = require('../../../../utils/fileProcess');
const { getEventFileFromReq } = require('./eventFileController');
this.email = new EventEmailService();

const { Event, EventFile } = require('../models');
const { SecurityUser } = require('../../security/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { event_name: 1 };
this.populate = [
  { path: 'customer', select: 'name ref clientCode' },
  { path: 'site', select: 'name' },
  { path: 'contact', select: 'firstName lastName email' },
  { path: 'notifyContacts', select: 'firstName lastName email ' },
  { path: 'supportingTechnicians', select: 'firstName lastName email ' },
  { path: 'primaryTechnician', select: 'firstName lastName email' },
  { path: 'machines', select: 'serialNo name' },
  { path: 'technicians', select: 'name phone email' },
  { path: 'completedBy', select: 'name phone email' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

exports.getEvent = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(Event, this.fields, req.params.id, this.populate);
    const files = await EventFile.find({ event: req.params.id, isArchived: false, isActive: true });
    const updatedEvent = { ...response.toObject(), files };
    res.json(updatedEvent);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    const queryDates = await fetchEventsDates(req.query?.month, req.query?.year);
    this.query.eventDate = queryDates.eventDate;
    delete this.query.month;
    delete this.query.year;
    const events = await this.dbservice.getObjectList(req, Event, this.fields, this.query, this.orderBy, this.populate);

    const updatedEvents = await Promise.all(events.map(async event => {
      const files = await EventFile.find({ event: event._id, isArchived: false, isActive: true });
      return { ...event.toObject(), files };
    }));

    res.json(updatedEvents);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

async function fetchEventsDates(month = (new Date()).getMonth() + 1, year = (new Date()).getFullYear()) {

  // Calculate the start and end dates for the month
  const startDate = new Date(year, month - 1, 1); // month is 0-based index in JavaScript
  const endDate = new Date(year, month, 0);

  // Calculate start and end dates for 7 days before and after
  const startDateBefore = new Date(startDate);
  startDateBefore.setDate(startDate.getDate() - 7);

  const endDateAfter = new Date(endDate);
  endDateAfter.setDate(endDate.getDate() + 7);

  try {
    return {
      start: {
        $gte: startDateBefore,
        $lte: endDateAfter
      }
    };
  } catch (error) {
    console.error('Error fetching Events:', error);
    throw error;
  }
}


exports.deleteEvent = async (req, res, next) => {
  try {
    await Event.updateOne({ _id: req.params.id }, { isActive: false, isArchive: true })
    res.status(StatusCodes.OK).send("Event archived successfully!");
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {

      if (!req.body.loginUser) {
        req.body.loginUser = await getToken(req);
      }
      // req.body.isCustomerEvent = isCustomerEvent === true || isCustomerEvent === 'true'

      let requestedObject = getDocumentFromReq(req, 'new');
      const response = await this.dbservice.postObject(requestedObject);
      let objectWithPopulate = await this.dbservice.getObjectById(Event, this.fields, response._id, this.populate);
      const user = await SecurityUser.findOne({ _id: req.body.loginUser.userId, isActive: true, isArchived: false })
      req.params.eventId = response._id
      await handleEventFiles(req)
      const files = await EventFile.find({ event: response._id, isArchived: false, isActive: true });
      objectWithPopulate = {
        ...objectWithPopulate._doc,
        files: files || [],
      };
      res.status(StatusCodes.CREATED).json({ Event: objectWithPopulate });
      await this.email.sendEmailAlert(req, objectWithPopulate, user, "New event notification");
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};



exports.patchEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (!req.body.loginUser) {
        req.body.loginUser = await getToken(req);
      }
      await this.dbservice.patchObject(Event, req.params.id, getDocumentFromReq(req));
      let objectWithPopulate = await this.dbservice.getObjectById(Event, this.fields, req.params.id, this.populate);
      const user = await SecurityUser.findOne({ _id: req.body.loginUser.userId, isActive: true, isArchived: false })
      req.params.eventId = req.params.id
      await handleEventFiles(req)
      const files = await EventFile.find({ event: req.params.id, isArchived: false, isActive: true });
      objectWithPopulate = {
        ...objectWithPopulate._doc,
        files: files || [],
      };
      res.status(StatusCodes.ACCEPTED).json({ Event: objectWithPopulate });
      await this.email.sendEmailAlert(req, objectWithPopulate, user, 'Event update notification');
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

const handleEventFiles = async (req) => {
  try {
    let files = [];
    if (req?.files?.images) {
      files = req.files.images;
    } else {
      return;
    }
    const fileProcessingPromises = files.map(async (file) => {
      if (!file || !file.originalname) {
        throw new Error('Invalid file');
      }
      const processedFile = await processFile(file, req.body.loginUser.userId);
      req.body.event = req.params.eventId;
      req.body.path = processedFile.s3FilePath;
      req.body.fileType = req.body.type = processedFile.type;
      req.body.extension = processedFile.fileExt;
      req.body.awsETag = processedFile.awsETag;
      req.body.eTag = processedFile.eTag;
      req.body.name = processedFile.name;
      if (processedFile.base64thumbNailData) {
        req.body.thumbnail = processedFile.base64thumbNailData;
        req.body.name = processedFile.name;
      }
      const eventFileObject = getEventFileFromReq(req, 'new');
      return this.dbservice.postObject(eventFileObject);
    });
    await Promise.all(fileProcessingPromises);
    return
  } catch (e) {
    throw new Error("Files Save Failed!");
  }
}

async function getToken(req) {
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

function getDocumentFromReq(req, reqType) {
  const { isCustomerEvent, priority, customer, site, contact, machines, jiraTicket, primaryTechnician, supportingTechnicians, notifyContacts, status,
    description, note, isActive, isArchived, start, end, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Event({});
  }

  if ("isCustomerEvent" in req.body) {
    doc.isCustomerEvent = isCustomerEvent;
  }

  if ("priority" in req.body) {
    doc.priority = priority;
  }

  if ("customer" in req.body) {
    doc.customer = customer;
  }

  if ("site" in req.body) {
    doc.site = site;
  }

  if ("contact" in req.body) {
    doc.contact = contact;
  }
  if ("machines" in req.body) {
    doc.machines = machines;
  }

  if ("jiraTicket" in req.body) {
    doc.jiraTicket = jiraTicket;
  }

  if ("primaryTechnician" in req.body) {
    doc.primaryTechnician = primaryTechnician;
  }
  if ("supportingTechnicians" in req.body) {
    doc.supportingTechnicians = supportingTechnicians;
  }
  if ("notifyContacts" in req.body) {
    doc.notifyContacts = notifyContacts;
  }
  if ("notifyContacts" in req.body) {
    doc.notifyContacts = notifyContacts;
  }
  if ("status" in req.body) {
    doc.status = status;
  }
  if ("description" in req.body) {
    doc.description = description;
  }
  if ("note" in req.body) {
    doc.note = note;
  }

  if ("start" in req.body) {
    doc.start = start;
  }

  if ("end" in req.body) {
    doc.end = end;
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
  return doc;
}


exports.getDocumentFromReq = getDocumentFromReq;