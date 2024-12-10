const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const securitySignInLogController = require('../controllers/securitySignInLogController');
const logger = require('../../config/logger');
const _ = require('lodash');

async function generateRandomString() {
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
  
  async function isTokenExpired(tokenExpiry) {
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
  
  async function issueToken(userID, userEmail, sessionID, roles, dataAccessibilityLevel) {
    const filteredRoles = roles
    .filter(role => role.isActive && !role.isArchived)
    .map(role => role.roleType);
  
    let token;
    let tokenData = { userId: userID, email: userEmail, sessionId: sessionID, dataAccessibilityLevel: dataAccessibilityLevel, roleTypes: filteredRoles };
  
    try {
  
      token = jwt.sign(
        tokenData,
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
  
  async function updateUserToken(accessToken) {
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


  async function addAccessLog(actionType, requestedLogin, userID, ip = null, userInfo) {
    let existsButNotAuthCode = 470;
    if (userInfo && !_.isEmpty(userInfo) && actionType == 'existsButNotAuth') {
      const isValidRole = userInfo.roles.some(role => role.isActive === true && role.isArchived === false);
      existsButNotAuthCode = userInfo.customer.type != 'SP' ? "452":userInfo.customer.isActive == false ? "453":userInfo.customer.isArchived == true ? "454":
      userInfo.isActive == false ? "455":userInfo.isArchived == true ? "456":
      userInfo?.contact?.isActive == false ? "457":userInfo?.contact?.isArchived == true ? "458":
      (_.isEmpty(userInfo.roles) || !isValidRole)  ? "459":
      !(typeof userInfo.lockUntil === "undefined" || userInfo.lockUntil == null || new Date() >= userInfo.lockUntil) ? "460":"405"; 
    }
  
    if (actionType == 'login') {
      var signInLog = {
        requestedLogin: requestedLogin,
        user: userID,
        loginIP: ip,
        statusCode: 200
      };
    } else if (actionType == 'invalidCredentials' || actionType == 'blockedCustomer' || actionType == 'blockedUser' 
    || actionType == 'existsButNotAuth') {
      var signInLog = {
        requestedLogin: requestedLogin,
        user: userID,
        loginIP: ip,
        statusCode: actionType == 'invalidCredentials' ? 461 : //Only password issue
                    actionType == 'blockedCustomer' ? 462 :
                    actionType == 'blockedUser' ? 463 :
                    actionType == 'existsButNotAuth' ? existsButNotAuthCode : 470
      };
    } else if (actionType == 'invalidIPs' || actionType == 'invalidRequest') {
      var signInLog = {
        requestedLogin: requestedLogin,
        loginIP: ip,
        statusCode: actionType == 'invalidIPs' ? 464 : 
                    actionType == 'invalidRequest' ? 465 : 470
      };
    }
    
    var reqSignInLog = {};
    reqSignInLog.body = signInLog;
  
    const res = securitySignInLogController.getDocumentFromReq(reqSignInLog, 'new');
    return res;
  }
  
module.exports = {
    generateRandomString,
    isTokenExpired,
    comparePasswords,
    issueToken,
    updateUserToken,
    addAccessLog
}