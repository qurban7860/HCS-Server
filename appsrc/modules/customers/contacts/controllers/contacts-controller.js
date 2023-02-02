const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Contacts } = require('../models');
const logger = require('../../../config/logger');
let rtnMsg = require('../../../config/static/static')

let contactService = require('../service/contacts-service')
this.contactserv = new contactService();

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {}, this.query = {}, this.orderBy = { name: 1 }, this.populate = 'user';

exports.getContact = async (req, res, next) => {
  this.contactserv.getObjectById(Contacts, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getContacts = async (req, res, next) => {
  this.contactserv.getContacts(Contacts, this.fields, this.query, this.orderBy, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteContact = async (req, res, next) => {
  this.contactserv.deleteObject(Contacts, req.params.id, callbackFunc);
  console.log(req.params.id);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postContact = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { 
        customerId, firstName, lastName, title, contactTypes,
        phone, email, isPrimary, isDisabled, isArchived,} = req.body;
    const contactSchema = new Contacts({
        customerId,
        firstName,
        lastName,
        title,
        contactTypes,
        phone,
        email,
        isPrimary,
        isDisabled,
        isArchived,
    });

    this.contactserv.postContact(contactSchema, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ contacts: response });
      }
    }
  }
};

exports.patchContact = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.contactserv.patchContact(Contacts, req.params.id, req.body, callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};