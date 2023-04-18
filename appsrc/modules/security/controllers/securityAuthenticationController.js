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
  
  // console.log('req.body :', req.body);
  const errors = validationResult(req);
  var _this=this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    // check if email exists
    //console.log('req.body :', req.body);
    let queryString  = { login: req.body.email };

    this.dbservice.getObject(SecurityUser, queryString, {path: 'customer', select: 'name type isActive isArchived'}, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {  
        //console.log('response.customer: ', response.customer);
        //console.log('response.customer.type:', response.customer.type);

        //&& response.customer.type == 'SP'  && response.customer.isActive && !response.customer.isArchived
        
        if(!(_.isEmpty(response)) && isValidCustomer(response.customer)  ){
          const existingUser = response;
          //console.log('existingUser:', existingUser);
          // console.log('response.length:', response.length);
          
            const passwordsResponse = await comparePasswords(req.body.password, existingUser.password)
            //console.log('passwordsResponse: ', passwordsResponse);
            if(passwordsResponse){
              const accessToken = await issueToken(existingUser._id, existingUser.login);
              //console.log('accessToken: ', accessToken)
              if(accessToken){
                updatedToken = updateUserToken(accessToken);
                _this.dbservice.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
                  function callbackPatchFunc(error, response) {
                    if (error) {
                      logger.error(new Error(error));
                      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                    }

                    res.json({ accessToken,
                      userId: existingUser.id,
                      user: {
                        login: existingUser.login,
                        displayName: existingUser.name
                      }
                    });

                  }
                
              }
            }else{
              res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));
            }
          
          
        }else{
          res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));       
        }
      }
    }
  }
};

function isValidCustomer(customer){
  if (_.isEmpty(customer) || customer.type != 'SP' || customer.isActive == false || customer.isArchived == true){
    return false;
  }
  return true;
}

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