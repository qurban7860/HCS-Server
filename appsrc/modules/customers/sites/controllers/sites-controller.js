const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Sites } = require('../models');
const HttpError = require('../../../config/models/http-error');
const logger = require('../../../config/logger');
let rtnMsg = require('../../../config/static/static')

let SiteService = require('../service/site-service')
this.siteserv = new SiteService();

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {}, this.query = {}, this.orderBy = { name: 1 }, this.populate = 'department';

exports.getSite = async (req, res, next) => {
  this.siteserv.getObjectById(Sites, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getSites = async (req, res, next) => {
  this.siteserv.getSites(Sites, this.fields, this.query, this.orderBy, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSite = async (req, res, next) => {
  this.siteserv.deleteObject(Sites, req.params.id, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postSite = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { name, billingSite, phone, email, fax, website, street, suburb,
       city, region, country, isDisabled, isArchived } = req.body;
    const siteSchema = new Sites({
      name,
      billingSite,
      phone,
      email,
      fax,
      website,
      address: {
        street,
        suburb,
        city,
        region,
        country,
      },
      isDisabled, 
      isArchived
    });

    this.siteserv.postSite(siteSchema, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ Sites: response });
      }
    }
  }
};

exports.patchSite = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    req.body.image = req.file == undefined ? req.body.imagePath : req.file.path;

    this.siteserv.patchSite(Sites, req.params.id, req.body, callbackFunc);
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