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

let calenderDBService = require('../service/calenderDBService')
this.dbservice = new calenderDBService();

const { Visit } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { visit_name: 1 };
this.populate = [
  { path: 'customer', select: 'name ref clientCode' },
  { path: 'site', select: 'name' },
  { path: 'contact', select: 'firstName lastName email' },
  { path: 'notifyContacts', select: 'firstName lastName email' },
  { path: 'supportingTechnicians', select: 'firstName lastName email' },
  { path: 'primaryTechnician', select: 'firstName lastName email' },



  { path: 'machine', select: 'serialNo' },
  { path: 'technicians', select: 'name phone email' },
  { path: 'completedBy', select: 'name phone email' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

exports.getVisit = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(Visit, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getVisits = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    const queryDates = await fetchVisitsDates(req.query?.month, req.query?.year);
    this.query.visitDate = queryDates.visitDate;
    delete this.query.month;
    delete this.query.year;
    const response = await this.dbservice.getObjectList(req, Visit, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

async function fetchVisitsDates(month = (new Date()).getMonth() + 1, year = (new Date()).getFullYear()) {

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
      visitDate: {
        $gte: startDateBefore,
        $lte: endDateAfter
      }
    };
  } catch (error) {
    console.error('Error fetching visits:', error);
    throw error;
  }
}


exports.deleteVisit = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Visit, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postVisit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const requestedObject = getDocumentFromReq(req, 'new');
      const response = await this.dbservice.postObject(requestedObject);
      const objectWithPopulate = await this.dbservice.getObjectById(Visit, this.fields, response._id, this.populate);
      res.status(StatusCodes.CREATED).json({ Visit: objectWithPopulate });
      exports.sendEmailAlert(objectWithPopulate);
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


exports.sendEmailAlert = async (visitData) => {
  if (visitData) {
    let emailSubject = "Calendar Events Alerts";
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const primaryEmail = emailRegex.test(visitData.primaryTechnician.email) ? visitData.primaryTechnician.email : null;
    const notifyContacts = visitData.notifyContacts.filter(email => emailRegex.test(email));
    const supportTechnicians = visitData.supportingTechnicians.filter(email => emailRegex.test(email));
    

    let emalsToSend = notifyContacts.concat(supportTechnicians);
    
    if(primaryEmail)
      emalsToSend.push(visitData.primaryTechnician);
    
    let emalsToSend_ = emalsToSend.map(obj => obj.email);
    let params = {
      to: primaryEmail,
      subject: emailSubject,
      html: true
    };

    const customer = visitData?.customer?.name;
    const serialNo = visitData?.machine?.serialNo;
    const Site = visitData?.site?.name;
    const purposeOfVisit = visitData?.purposeOfVisit;
    const visitDate = formatDate(visitData?.visitDate);
    const createdBy = visitData?.createdBy?.name;
    const createdAt = visitData?.createdBy?.name;

    const options = {
      timeZone: 'Pacific/Auckland', // New Zealand time zone
      hour12: true, // 24-hour format
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    

    console.log("visitData?.end", visitData?.end);
    const startTime = visitData?.start?.toLocaleString('en-NZ', options);
    const endTime = visitData?.end?.toLocaleString('en-NZ', options);


    console.log({startTime});


    let hostName = 'portal.howickltd.com';

    if (process.env.CLIENT_HOST_NAME)
      hostName = process.env.CLIENT_HOST_NAME;

    let hostUrl = "https://portal.howickltd.com";

    if (process.env.CLIENT_APP_URL)
      hostUrl = process.env.CLIENT_APP_URL;

    fs.readFile(__dirname + '/../../email/templates/footer.html', 'utf8', async function (err, data) {
      let footerContent = render(data, { emailSubject, hostName, hostUrl })

      fs.readFile(__dirname + '/../../email/templates/CalendarAlert.html', 'utf8', async function (err, data) {
        let htmlData = render(data, { emailSubject, hostName, hostUrl, footerContent, customer, serialNo, Site, purposeOfVisit, visitDate, startTime, endTime, createdBy, createdAt })
        params.htmlData = htmlData;
        let response = await awsService.sendEmail(params, emalsToSend_);
        console.log(response);
      })
    })
  } else {
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
  
    return `${day}${suffix} ${months[monthIndex]} ${year}`;
  } else {
    return "";
  }
}


exports.patchVisit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(Visit, req.params.id, getDocumentFromReq(req));
      const objectWithPopulate = await this.dbservice.getObjectById(Visit, this.fields, req.params.id, this.populate);
      res.status(StatusCodes.ACCEPTED).json({ Visit: objectWithPopulate });
      exports.sendEmailAlert(objectWithPopulate);
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

function getDocumentFromReq(req, reqType) {
  const { customer, site, contact, machine, jiraTicket, primaryTechnician, supportingTechnicians, notifyContacts, status,
    purposeOfVisit, visitNote, isActive, isArchived, visitDate, start, end, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Visit({});
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
  if ("machine" in req.body) {
    doc.machine = machine;
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
  if ("purposeOfVisit" in req.body) {
    doc.purposeOfVisit = purposeOfVisit;
  }
  if ("visitNote" in req.body) {
    doc.visitNote = visitNote;
  }
  if ("visitDate" in req.body) {
    doc.visitDate = visitDate;
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