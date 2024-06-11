const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { render } = require('template-file');
const fs = require('fs');
const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const awsService = require('../../../base/aws');
const emailController = require('../../email/controllers/emailController');
let calenderDBService = require('../service/calenderDBService')
const { filterAndDeduplicateEmails, verifyEmail } = require('../../email/utils');

this.dbservice = new calenderDBService();

const { Event } = require('../models');
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
    res.json(response);
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
    const response = await this.dbservice.getObjectList(req, Event, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
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
    const result = await this.dbservice.deleteObject(Event, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
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
      const requestedObject = getDocumentFromReq(req, 'new');
      const response = await this.dbservice.postObject(requestedObject);
      const objectWithPopulate = await this.dbservice.getObjectById(Event, this.fields, response._id, this.populate);
      const user = await SecurityUser.findOne({ _id: req.body.loginUser.userId, isActive: true, isArchived: false })
      res.status(StatusCodes.CREATED).json({ Event: objectWithPopulate });
      exports.sendEmailAlert(objectWithPopulate, user, "New Event Notification" );
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


exports.sendEmailAlert = async (eventData, securityUser, emailSubject) => {

  const securityUserName = securityUser?.name;
  const uniqueTechnicians = new Set();
  const primaryTechnicianName = ` ${eventData?.primaryTechnician?.firstName?.trim() || ''} ${eventData?.primaryTechnician?.lastName?.trim() || ''}`;
  if (primaryTechnicianName) {
    uniqueTechnicians.add(primaryTechnicianName);
  }

  if (eventData && securityUserName) {
    const primaryEmail = verifyEmail(eventData?.primaryTechnician?.email);
    let supportingContactsEmailsSet = filterAndDeduplicateEmails(eventData?.supportingTechnicians);
    if(primaryEmail && !supportingContactsEmailsSet.has(primaryEmail)){
      const emailArray = Array.from(supportingContactsEmailsSet);
      emailArray.splice(0, 0, primaryEmail);
      supportingContactsEmailsSet = new Set(emailArray);
    }
    const notifyContactsEmailsSet = filterAndDeduplicateEmails(eventData?.notifyContacts);
    for (const email of supportingContactsEmailsSet) {
      notifyContactsEmailsSet.delete(email);
    }

    const notifyContactsEmails = Array.from(notifyContactsEmailsSet);
    const supportingContactsEmails = Array.from(supportingContactsEmailsSet);

    eventData.supportingTechnicians.forEach(sp => {
      const technicianName = ` ${sp?.firstName?.trim() || ''} ${sp?.lastName?.trim() || ''}`;
      if (!uniqueTechnicians.has(technicianName)) {
        uniqueTechnicians.add(technicianName);
      }
    });

    const technicians = Array.from(uniqueTechnicians);
    let emalsToSend

    if(process.env.ENV.toLocaleUpperCase() === 'LIVE' || true ){
      emalsToSend = supportingContactsEmails;
    } else {
      emalsToSend = [
        'a.hassan@terminustech.com',
        'zeeshan@terminustech.com',	
        'muzna@terminustech.com',
      ]
    }
    
    let params = {
      to: primaryEmail,
      ccAddresses: notifyContactsEmails,
      subject: emailSubject,
      html: true
    };

    const customer = eventData?.customer?.name;
    const serialNo = eventData?.machines?.map((m)=> m.serialNo);
    const Site = eventData?.site?.name;
    const description = eventData?.description;
    const date = formatDate(eventData?.start);
    const createdBy = eventData?.createdBy?.name;
    const createdAt = eventData?.createdBy?.name;

    const options = {
      timeZone: 'Pacific/Auckland', // New Zealand time zone
      hour12: true, // 24-hour format
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const startTime = eventData?.start?.toLocaleString('en-NZ', options);
    const endTime = eventData?.end?.toLocaleString('en-NZ', options);
    let hostName = 'portal.howickltd.com';

    if (process.env.CLIENT_HOST_NAME)
      hostName = process.env.CLIENT_HOST_NAME;

    let hostUrl = "https://portal.howickltd.com";

    if (process.env.CLIENT_APP_URL)
      hostUrl = process.env.CLIENT_APP_URL;
    const emailResponse = await addEmail(params.subject, "abbc", securityUser?.email, params.to, '', params.ccAddresses );
    this.dbservice.postObject(emailResponse, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      }
    }

    fs.readFile(__dirname + '/../../email/templates/footer.html', 'utf8', async function (err, data) {
      let footerContent = render(data, { emailSubject, hostName, hostUrl })
      fs.readFile(__dirname + '/../../email/templates/CalendarAlert.html', 'utf8', async function (err, data) {
        let htmlData = render(data, { emailSubject, hostName, hostUrl, securityUserName, footerContent, customer, serialNo, Site, description, technicians, date, startTime, endTime, createdBy, createdAt })
        params.htmlData = htmlData;
        await awsService.sendEmail(params, emalsToSend );
      })
    })
  }
}

function formatDate(date) {
  if(date) {
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
  
    // Array of month names
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
  
    // Suffix for day (st, nd, rd, th)
    const suffixes = ["th", "st", "nd", "rd"];
    const suffix = suffixes[(day - 1) % 10] || suffixes[0];
  
    return `${day} ${months[monthIndex]} ${year}`;
  } else {
    return "";
  }
}


exports.patchEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(Event, req.params.id, getDocumentFromReq(req));
      const objectWithPopulate = await this.dbservice.getObjectById(Event, this.fields, req.params.id, this.populate);
      const user = await SecurityUser.findOne({ _id: req.body.loginUser.userId, isActive: true, isArchived: false })
      res.status(StatusCodes.ACCEPTED).json({ Event: objectWithPopulate });
      exports.sendEmailAlert(objectWithPopulate, user, 'Event update notification');
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

function getDocumentFromReq(req, reqType) {
  const { customer, site, contact, machines, jiraTicket, primaryTechnician, supportingTechnicians, notifyContacts, status,
    description, note, isActive, isArchived, start, end, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Event({});
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

async function addEmail(subject, body, toUser, emailAddresses, fromEmail='', ccEmails = [],bccEmails = []) {
  var email = {
    subject,
    body,
    toEmails:emailAddresses,
    fromEmail:process.env.AWS_SES_FROM_EMAIL,
    customer:null,
    toContacts:[],
    toUsers:[],
    ccEmails,
    bccEmails,
    isArchived: false,
    isActive: true,
    // loginIP: ip,
    createdBy: '',
    updatedBy: '',
    createdIP: ''
  };
  
  if(toUser && mongoose.Types.ObjectId.isValid(toUser.id)) {
    email.toUsers.push(toUser.id);
    if(toUser.customer && mongoose.Types.ObjectId.isValid(toUser.customer.id)) {
      email.customer = toUser.customer.id;
    }

    if(toUser.contact && mongoose.Types.ObjectId.isValid(toUser.contact.id)) {
      email.toContacts.push(toUser.contact.id);
    }
  }
  
  var reqEmail = {};

  reqEmail.body = email;
  
  const res = emailController.getDocumentFromReq(reqEmail, 'new');
  return res;
}


exports.getDocumentFromReq = getDocumentFromReq;