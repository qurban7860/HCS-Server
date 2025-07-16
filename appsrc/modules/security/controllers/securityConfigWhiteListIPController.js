const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecurityConfigWhiteListIP } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'customer', select: 'name' },
  { path: 'user', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.searchSecurityConfigWhiteListIP = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    this.dbservice.getObjectList(req, SecurityConfigWhiteListIP, this.fields, this.query, this.orderBy, this.populate, callbackFunc);

    function callbackFunc(error, securityConfigs) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {

        if (searchName) {
          let filterSecurityConfigWhiteListIPs = [];

          for (let securityConfig of securityConfigs) {
            let name = securityConfig.blockedUsers.name.toLowerCase();
            if (name.search(searchName.toLowerCase()) > -1) {
              filterSecurityConfigWhiteListIPs.push(securityConfig);
            }
          }

          securityConfigs = filterSecurityConfigWhiteListIPs;

        }

        return res.status(StatusCodes.OK).json(securityConfigs);
      }
    }

  }
}


exports.getSecurityConfigWhiteListIP = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.dbservice.getObjectById(SecurityConfigWhiteListIP, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecurityConfigWhiteListIPs = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.dbservice.getObjectList(req, SecurityConfigWhiteListIP, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteSecurityConfigWhiteListIP = async (req, res, next) => {
  this.dbservice.deleteObject(SecurityConfigWhiteListIP, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postSecurityConfigWhiteListIP = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const allowedProperties = ['loginUser'];
    const invalidProperties = Object.keys(req.body).filter(prop => !allowedProperties.includes(prop));

    if (invalidProperties.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ SecurityConfigWhiteListIP: response });
      }
    }
  }
};

exports.patchSecurityConfigWhiteListIP = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchSecurityConfigWhiteListIP');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecurityConfigWhiteListIP, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { loginUser } = req.body;
  const allowedFields = ["ipAddress", "customer", "user", "Application", "description", "isActive", "isArchived"]
  const doc = reqType === "new" ? new Ticket({}) : {};

  allowedFields.forEach((f) => {
    if (f in req.body) {
      if (req.body[f] === "null") {
        doc[f] = null;
      } else {
        doc[f] = req.body[f];
      }
    }
  });

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