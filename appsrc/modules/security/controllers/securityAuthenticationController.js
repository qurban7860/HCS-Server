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
const awsService = require('../../../../appsrc/base/aws');
const { render } = require('template-file');
const fs = require('fs');

let securityDBService = require('../service/securityDBService');
const dbService = this.dbservice = new securityDBService();

const emailController = require('../../email/controllers/emailController');
const securitySignInLogController = require('./securitySignInLogController');
const { SecurityUser, SecuritySignInLog } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.clientURL = process.env.CLIENT_APP_URL;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  {path: 'roles', select: ''},
];


this.populateList = [
  { path: '', select: '' }
];


exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  console.log("login....");
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let queryString = { $or:[{login: req.body.email}, {email: req.body.email}] , isActive:true, isArchived:false };
    this.dbservice.getObject(SecurityUser, queryString, [{ path: 'customer', select: 'name type isActive isArchived' }, { path: 'contact', select: 'name isActive isArchived' }, {path: 'roles', select: ''}], getObjectCallback);
    async function getObjectCallback(error, response) {

      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        const existingUser = response;
        if (!(_.isEmpty(existingUser)) && isValidCustomer(existingUser.customer) && isValidContact(existingUser.contact) && isValidRole(existingUser.roles)) {

          let passwordsResponse = await comparePasswords(req.body.password, existingUser.password)
          
          if(passwordsResponse) {

            if (existingUser.multiFactorAuthentication) {

              // User has enabled MFA, so redirect them to the MFA page
              // Generate a one time code and send it to the user's email address
              const code = Math.floor(100000 + Math.random() * 900000);
              
              let emailContent = `Dear ${existingUser.name},<br><br>Your Multi-Factor Authentication Code for login is ${code}.As a security measure we recommend not sharing your code with anyone.`;
              let emailSubject = "Multi-Factor Authentication Code";

              let params = {
                to: `${existingUser.email}`,
                subject: emailSubject,
                html: true
              };
              // console.log("@2");
              fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {
                let htmlData = render(data,{ emailSubject, emailContent })
                params.htmlData = htmlData;
                let response = await awsService.sendEmail(params);
              })
              const emailResponse = await addEmail(params.subject, params.htmlData, existingUser, params.to);
              _this.dbservice.postObject(emailResponse, callbackFunc);
              function callbackFunc(error, response) {
                // console.log("add object -->", response);
                if (error) {
                  logger.error(new Error(error));
                  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                } else {
                  let userMFAData = {};
                  userMFAData.multiFactorAuthenticationCode = code;
                  const currentDate = new Date();
                  userMFAData.multiFactorAuthenticationExpireTime = new Date(currentDate.getTime() + 10 * 60 * 1000);
                  _this.dbservice.patchObject(SecurityUser, existingUser._id, userMFAData, callbackPatchFunc);
                  
                  function callbackPatchFunc(error, response) {
                    return res.status(StatusCodes.ACCEPTED).send({message:'Authentification Code has been sent on your email!', multiFactorAuthentication:true, userId:existingUser._id});
                  }
                }
              }
              return;  
            }

            return await validateAndLoginUser(req, res, existingUser);

          }
          else {
            return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));
          }
        }
        else {
          return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'Invalid User/User does not have the rights to access', true));
        }
        
      }
    }
  }
};


async function validateAndLoginUser(req, res, existingUser) {
  
  const accessToken = await issueToken(existingUser._id, existingUser.login);
  //console.log('accessToken: ', accessToken)
  if (accessToken) {
    let updatedToken = updateUserToken(accessToken);
   
    dbService.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
    async function callbackPatchFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      }
      const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
      const loginLogResponse = await addAccessLog('login', existingUser._id, clientIP);
      dbService.postObject(loginLogResponse, callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        } else {
          return res.json({
            accessToken,
            userId: existingUser.id,
            user: {
              login: existingUser.login,
              email: existingUser.email,
              displayName: existingUser.name,
              roles: existingUser.roles
            }
          });
        }
      }
    }
  }
  else {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
  
}

exports.multifactorverifyCode = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let existingUser = await SecurityUser.findOne({ _id: req.body.userID })
    .populate({ path: 'customer', select: 'name type isActive isArchived' })
    .populate({ path: 'contact', select: 'name isActive isArchived' })
    .populate('roles');

    if(existingUser){
      if (existingUser.multiFactorAuthenticationCode == req.body.code) {
        const currentTime = new Date();
        const multiFactorAuthenticationExpireTime = new Date(existingUser.multiFactorAuthenticationExpireTime);

        // Check if the code has expired
        if (currentTime <= multiFactorAuthenticationExpireTime) {  
          return await validateAndLoginUser(req, res, existingUser);
        } 
        else {
          return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'The code is no longer valid.', true));
        }
      } else {
        return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'Invalid code', true));
      }
    }
    else{
      return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'Code not found', true));
    }
  }
};








exports.refreshToken = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let existingUser = await SecurityUser.findOne({ _id: req.body.userID });
    if(existingUser){
    const accessToken = await issueToken(existingUser._id, existingUser.login);
    if (accessToken) {
      updatedToken = updateUserToken(accessToken);
      _this.dbservice.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
      async function callbackPatchFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        }
        else {
          return res.json({
            accessToken,
            userId: existingUser.id,
            user: {
              login: existingUser.login,
              email: existingUser.email,
              displayName: existingUser.name,
              roles: existingUser.roles
            }
          });
        }
      }
    }
  }
    else{
      res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'User not found', true));
    }
  }
};

function isValidCustomer(customer) {
  if (_.isEmpty(customer) || 
  customer.type != 'SP' || 
  customer.isActive == false || 
  customer.isArchived == true) {
    return false;
  }
  return true;
}

function isValidContact(contact){
  if (!_.isEmpty(contact)){
    if(contact.isActive == false || contact.isArchived == true) {
      return false;
    }
  }
  return true;
}

function isValidRole(roles) {
  const isValidRole = roles.some(role => role.isActive === true && role.isArchived === false);

  if (_.isEmpty(roles) || !isValidRole) {
    return false;
  }
  return true;
}

exports.logout = async (req, res, next) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  let existingSignInLog = await SecuritySignInLog.findOne({ user: req.params.userID, loginIP: clientIP }).sort({ loginTime: -1 }).limit(1);
  if (!existingSignInLog.logoutTime) {
    this.dbservice.patchObject(SecuritySignInLog, existingSignInLog._id, { logoutTime: new Date() }, callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      }
    }
  }

  res.status(StatusCodes.OK).send(rtnMsg.recordLogoutMessage(StatusCodes.OK));

  // const currentTime = Date.now;
  // var signOutLog = {
  //   user: userID,
  //   logOutTime: currentTime,
  // };

  // const diffInMilliseconds = Math.abs(currentTime - user.loginTime);
  // const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

  // if (diffInHours >= 2) {
  //   console.log("Time diff is greater than or equal to 2 hours");
  // var reqSignOutLog = {};
  // reqSignOutLog.body = signOutLog;
  // const res = await securitySignInLogController.getDocumentFromReq(reqSignOutLog);


  // } 
  // else {
  //   console.log("time diff < 2 hours");
  //   var reqSignOutLog = {};
  //   reqSignOutLog.body = signOutLog;
  // }
  // return res;
};

exports.forgetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const existingUser = await SecurityUser.findOne({ email: req.body.email })
        .populate([{ path: 'customer', select: 'name type isActive isArchived' },
                  { path: 'contact', select: 'name isActive isArchived' }]);
    if (existingUser && isValidCustomer(existingUser.customer)) {
      const token = await generateRandomString();
      let updatedToken = updateUserToken(token);
      _this.dbservice.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
      const link = `${this.clientURL}auth/new-password/${token}/${existingUser._id}`;
      async function callbackPatchFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        } else {

          let emailContent = `Hi ${existingUser.name},<br><br>You requested to reset your password.<br>
                          <br>Please click the link below to reset your password.<br>
                          <br><a href="${link}">Click here</a>`;
          let emailSubject = "Reset Password";

          let params = {
            to: `${existingUser.email}`,
            subject: emailSubject,
            html: true
          };

          fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {

            let htmlData = render(data,{ emailSubject, emailContent })
            params.htmlData = htmlData;
            let response = await awsService.sendEmail(params);
          })

          // let response = await awsService.sendEmail(params);
          
          const emailResponse = await addEmail(params.subject, params.htmlData, existingUser, params.to);
          
          _this.dbservice.postObject(emailResponse, callbackFunc);
          function callbackFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
            } else {
              res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Email sent successfully!', false));
            }
          }
        }
      }
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'User is not authorized to login', true));
    }
  }
};


exports.verifyForgottenPassword = async (req, res, next) => {
  try {
    let _this = this;
    const existingUser = await SecurityUser.findById(req.body.userId)
        .populate([{ path: 'customer', select: 'name type isActive isArchived' },
                  { path: 'contact', select: 'name isActive isArchived' }]);
    if (existingUser) {
      if (existingUser.token && existingUser.token.accessToken == req.body.token) {        
        const tokenExpired = isTokenExpired(existingUser.token.tokenExpiry);
        if (!tokenExpired) {
          const hashedPassword = await bcrypt.hash(req.body.password, 12);
          this.dbservice.patchObject(SecurityUser, existingUser._id, { password: hashedPassword, token: {} }, callbackPatchFunc);
          async function callbackPatchFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
            } else {

              let emailContent = `Hi ${existingUser.name},<br><br>Your password has been update successfully.<br>
                              <br>Please sign in to access your account<br>`;
                              
              let emailSubject = "Password Reset Successful";

              let params = {
                to: `${existingUser.email}`,
                subject: emailSubject,
                html: true,
              };
              

              fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {

                let htmlData = render(data,{ emailSubject, emailContent })
                params.htmlData = htmlData;
                let response = await awsService.sendEmail(params);
              })


              // let response = await awsService.sendEmail(params);

              const emailResponse = await addEmail(params.subject, params.htmlData, existingUser, params.to);
          
              _this.dbservice.postObject(emailResponse, callbackFunc);
              function callbackFunc(error, response) {
                if (error) {
                  logger.error(new Error(error));
                  res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                } else {
                  res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordCustomMessageJSON(StatusCodes.ACCEPTED, 'Password updated successfully!', false));
                }
              }

            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Token Expired!', true));
        }
      }
      else {
        res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Token Invalid!', true));

      }
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'User not found!', true));
    }
  }
  catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }

};

function generateRandomString() {
  currentDate = new Date();
  return new Promise((resolve) => {
    const length = 32;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    resolve(result);
  });
}

function isTokenExpired(tokenExpiry) {
  const expiryDate = new Date(tokenExpiry);
  const currentDate = new Date();
  return currentDate > expiryDate;
}

async function comparePasswords(encryptedPass, textPass, next) {
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

async function issueToken(userID, userEmail) {
  let token;
  try {
    token = jwt.sign(
      { userId: userID, email: userEmail },
      //'supersecret_dont_share',
      process.env.JWT_SECRETKEY,
      { expiresIn: process.env.TOKEN_EXP_TIME || '48h'}
    );
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    return next(error);
  }
  return token;
};

function updateUserToken(accessToken) {
  currentDate = new Date();
  let doc = {};
  let token = {
    accessToken: accessToken,
    tokenCreation: currentDate,
    tokenExpiry: new Date(currentDate.getTime() + 60 * 60 * 1000)
  }
  doc.token = token;
  return doc;
};


async function addAccessLog(actionType, userID, ip = null) {
  if (actionType == 'login') {
    var signInLog = {
      user: userID,
      loginIP: ip
    };
    var reqSignInLog = {};
    reqSignInLog.body = signInLog;
    const res = securitySignInLogController.getDocumentFromReq(reqSignInLog, 'new');
    return res;
  }
}

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
  const { email, password } = req.body;


  let doc = {};
  if (reqType && reqType == "new") {
    doc = new SecurityConfig({});
  }
  if ("email" in req.body) {
    doc.email = email;
  }
  if ("password" in req.body) {
    doc.password = password;
  }

  if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }

  return doc;
}