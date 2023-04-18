const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
var ObjectId = require('mongoose').Types.ObjectId;
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
const _ = require('lodash');
let rtnMsg = require('../../config/static/static');


let securityDBService = require('../service/securityDBService');
this.dbservice = new securityDBService();

const securitySignInLogController = require('./securitySignInLogController');
const { SecurityUser, SecuritySignInLog } = require('../models');



this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: '', select: ''}
];


this.populateList = [
  {path: '', select: ''}
];


exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  var _this=this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    // check if email exists
    let queryString  = { email: req.body.email };
    this.dbservice.getObject(SecurityUser, queryString, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {  
        if(!(_.isEmpty(response))){
          const existingUser = response;
          var aggregate = [
            {
              $lookup: {
                from: "Customers",
                localField: "customer",
                foreignField: "_id",
                as: "customer"
              }
            },
              {
              $match: {
                "customer.type" : "SP",
                "customer._id": existingUser.customer
              }
            }
          ];
        
          var params = {};
          _this.dbservice.getObjectListWithAggregate(SecurityUser, aggregate, params, callbackFunc);
        
          async function callbackFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            } else {
              if(response.length > 0){
                const passwordsResponse = await comparePasswords(req.body.password, existingUser.password)
                if(passwordsResponse){
                  const accessToken = await issueToken(existingUser._id, existingUser.email);
                  if(accessToken){
                    updatedToken = updateUserToken(accessToken);
                    _this.dbservice.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
                      function callbackPatchFunc(error, response) {
                        if (error) {
                          logger.error(new Error(error));
                          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                        }
                      }
                    res.json({ accessToken,
                      userId: existingUser.id,
                      user: {
                        email: existingUser.email,
                        displayName: existingUser.name
                      }
                    });
                  }
                }else{
                  res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));
                }
              }else{
                res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCustomerTypeMessage(StatusCodes.FORBIDDEN));                
              }
            }
          }
        }else{
          res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));       
        }
      }
    }
  }
};


exports.logout = async (req, res, next) => {

  const logoutResponse = await addAccessLog('logout', req.params.userID);
  this.dbservice.postObject(logoutResponse, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordLogoutMessage(StatusCodes.OK));
      }
    }
};


async function comparePasswords(encryptedPass, textPass, next){
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(encryptedPass, textPass);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    return next(error);
  }

  return isValidPassword;
};


async function issueToken(userID, userEmail){
  let token;
  try {
    token = jwt.sign(
      { userId: userID, email: userEmail },
      //'supersecret_dont_share',
      process.env.JWT_SECRETKEY,
      { expiresIn: '1h' }
    );
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    return next(error);
  }
  return token;
};

function updateUserToken(accessToken){
  currentDate = new Date();
  let doc = {};
  let token = {
    accessToken: accessToken,
    tokenCreation: currentDate,
    tokenExpiry: new Date(currentDate.getTime() + 60 * 60 * 1000)
  }
  doc.token = token;
  return doc;
}

async function addAccessLog(actionType, userID, ip=null){
  currentTime = new Date();
  if(actionType == 'login'){ 
    var signInLog = {
      user: userID,
      loginTime: currentTime,
      LoginIP: ip,
    };
    var reqSignInLog = {};
    reqSignInLog.body = signInLog;
    const res = securitySignInLogController.getDocumentFromReq(reqSignInLog, 'new');
    return res;
  }
  if(actionType == 'logout'){
    var signOutLog = {
      user: userID,
      logOutTime: currentTime,
    };
    var reqSignOutLog = {};
    reqSignOutLog.body = signOutLog;
    const res = securitySignInLogController.getDocumentFromReq(reqSignOutLog, 'new');
    return res;
  }
  
}

function getDocumentFromReq(req, reqType){
  const { email, password } = req.body;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new SecurityConfig({});
  }
  if ("email" in req.body){
    doc.email = email;
  }
  if ("password" in req.body){
    doc.password = password;
  }
  
  if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  return doc;
}