const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const awsService = require('../../../../appsrc/base/aws');
let calenderDBService = require('../service/calenderDBService')
this.dbservice = new calenderDBService();
const fs = require('fs');
const { render } = require('template-file');
const emailController = require('../../email/controllers/emailController');
const { Visit } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { visit_name: 1 };
this.populate = [
  { path: 'customer', select: 'name ref clientCode' },
  { path: 'site', select: 'name' },
  { path: 'contact', select: 'firstName lastName' },
  { path: 'notifyContacts', select: 'firstName lastName email' },
  { path: 'supportingTechnicians', select: 'firstName lastName' },
  { path: 'primaryTechnician', select: 'firstName lastName' },
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
  
  console.log("month", month);
  console.log("year", year);
  
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
      if (objectWithPopulate) {
        const contactsEmailFiltered = objectWithPopulate?.notifyContacts?.map((el)=> el?.email)
        let emailContent = `Event has been added against Customer ${objectWithPopulate?.customer || ''} and Jira ticket ${objectWithPopulate?.jiraTicket || '' }.<br>`;

          let emailSubject = "Event created Successful";

          let params = {
          to: `${contactsEmailFiltered}`,
          subject: emailSubject,
          html: true,
          };

          let hostName = 'portal.howickltd.com';

          if(process.env.CLIENT_HOST_NAME)
          hostName = process.env.CLIENT_HOST_NAME;

          let hostUrl = "https://portal.howickltd.com";

          if(process.env.CLIENT_APP_URL)
          hostUrl = process.env.CLIENT_APP_URL;

          let username = 'Howickltd';
          fs.readFile(__dirname+'/../../email/templates/footer.html','utf8', async function(err,data) {
          let footerContent = render(data,{ emailSubject, emailContent, hostName, hostUrl, })
          
          fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {
          let htmlData = render(data,{ emailSubject, emailContent, hostName, hostUrl, username, footerContent })
          params.htmlData = htmlData;
          let response = await awsService.sendEmail(params);
          })
          })

          const emailResponse = await addEmail(params.subject, params.htmlData, '', params.to);

          this.dbservice.postObject(emailResponse, callbackFunc);
          function callbackFunc(error, response) {
          if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          } else {
          res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordCustomMessageJSON(StatusCodes.ACCEPTED, 'Event Added successfully!', false));
          }
          }
        console.log("contactsEmailFiltered : ", contactsEmailFiltered);
      } 
      res.status(StatusCodes.CREATED).json({ Visit: objectWithPopulate });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchVisit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const result = await this.dbservice.patchObject(Visit, req.params.id, getDocumentFromReq(req));
      const objectWithPopulate = await this.dbservice.getObjectById(Visit, this.fields, req.params.id, this.populate);
      res.status(StatusCodes.ACCEPTED).json({ Visit: objectWithPopulate });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

async function addEmail(subject, body, toUser, emailAddresses, fromEmail='', ccEmails = [],bccEmails = []) {
  var email = {
    subject,
    body,
    toEmails:emailAddresses,
    fromEmail:process.env.AWS_SES_FROM_EMAIL,
    customer:'',
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