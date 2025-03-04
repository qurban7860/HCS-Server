const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const _ = require('lodash');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecuritySignInLog, SecurityUser } = require('../models');
const { Customer } = require('../../crm/models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { loginTime: -1 };
this.populate = [
  { path: '', select: '' }
];


this.populateList = [
  {
    path: 'user', select: 'name email login customer contact roles',
    populate: [
      { path: "customer", select: "name type " },
      { path: "contact", select: "firstName lastName" },
      { path: 'roles', contact: '_id name' }
    ]
  }
];


exports.getSecuritySignInLog = async (req, res, next) => {
  this.dbservice.getObjectById(SecuritySignInLog, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecuritySignInLogs = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy
      delete this.query.orderBy
    }
    if (this.query.searchKey && this.query.searchColumn && !this.query.forDrawing) {
      const regexCondition = { $regex: this.query.searchKey, $options: "i" };
      if (this.query.searchColumn == "user.name") {
        const regexCondition = { $regex: escapeRegExp(this.query.searchKey), $options: "i" };
        const userIds = await SecurityUser.find({ "name": regexCondition }, "_id").lean();
        this.query.user = { $in: userIds?.map(s => s?._id) };
      } else if (this.query.searchColumn == "user.customer.name") {
        const regexCondition = { $regex: escapeRegExp(this.query.searchKey), $options: "i" };
        const customerIds = await Customer.find({ "name": regexCondition }, "_id").lean();
        const userIds = await SecurityUser.find({ "customer": { $in: customerIds?.map(m => m?._id) } }, "_id").lean();
        this.query.user = { $in: userIds?.map(s => s?._id) };
      } else {
        this.query[this.query.searchColumn] = regexCondition;
      }

      delete this.query.searchKey;
      delete this.query.searchColumn;
    }
    const response = await this.dbservice.getObjectList(req, SecuritySignInLog, this.fields, this.query, this.orderBy, this.populateList);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || error);
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.deleteSignInLog = async (req, res, next) => {
  this.dbservice.deleteObject(SecuritySignInLog, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.searchSignInLogs = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    this.query = req.query != "undefined" ? req.query : {};
    let searchName = this.query.name;
    delete this.query.name;
    this.dbservice.getObjectList(req, SecuritySignInLog, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);

    function callbackFunc(error, signInLogs) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {

        if (searchName) {
          let filterSignInLogs = [];

          for (let signInLog of signInLogs) {
            let name = signInLog.user.name.toLowerCase();
            if (name.search(searchName.toLowerCase()) > -1) {
              filterSignInLogs.push(signInLog);
            }
          }

          signInLogs = filterSignInLogs;

        }

        return res.status(StatusCodes.OK).json(signInLogs);
      }
    }

  }
}

exports.postSignInLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.CREATED).json({ SignInLog: response });
      }
    }
  }
};

exports.patchSignInLog = async (req, res, next) => {
  const errors = validationResult(req);
  //console.log('calling patchSignInLog');
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(SecuritySignInLog, req.params.id, getDocumentFromReq(req), callbackFunc);
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
  const { requestedLogin, user, loginTime, logoutTime, loginIP, loggedOutBy, statusCode, considerLog } = req.body;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new SecuritySignInLog({});
  }


  if ("requestedLogin" in req.body) {
    doc.requestedLogin = requestedLogin;
  }

  if ("user" in req.body) {
    doc.user = user;
  }
  if ("loginTime" in req.body) {
    doc.loginTime = loginTime;
  }
  if ("logoutTime" in req.body) {
    doc.logoutTime = logoutTime;
  }

  if ("loggedOutBy" in req.body) {
    doc.loggedOutBy = loggedOutBy;
  }

  if ("loginIP" in req.body) {
    doc.loginIP = loginIP;
  }

  if ("statusCode" in req.body) {
    doc.statusCode = statusCode;
  }


  if ("considerLog" in req.body) {
    doc.considerLog = considerLog;
  }

  if (reqType == "new" && "loginUser" in req.body) {
    doc.createdBy = req.body.loginUser.userId;
    doc.updatedBy = req.body.loginUser.userId;
    doc.createdIP = req.body.loginUser.userIP;
    doc.updatedIP = req.body.loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = req.body.loginUser.userId;
    doc.updatedIP = req.body.loginUser.userIP;
  }

  return doc;
}

exports.getDocumentFromReq = getDocumentFromReq;