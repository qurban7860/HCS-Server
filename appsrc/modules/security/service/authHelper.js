const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const securitySignInLogController = require('../controllers/securitySignInLogController');
const logger = require('../../config/logger');
const _ = require('lodash');
let securityDBService = require('./securityDBService');
this.dbservice = new securityDBService();
const { SecurityUser, SecuritySignInLog, SecuritySession } = require('../models');

async function generateRandomString() {
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

async function validateRecaptcha({ req, res }) {
  try {
    if (!req.body.recaptchaToken) {
      return { success: false, message: 'Missing reCAPTCHA token' };
    }
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: process.env.RECAPTCHA_KEY,
        response: req.body.recaptchaToken
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const data = response.data;

    if (!data?.success || data?.score < 0.5) {
      return res.status(400).json({ success: false, message: 'Failed reCAPTCHA verification' });
    }
    return (data.success || data.score > 0.5)
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal error verifying reCAPTCHA' });
  }
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

async function issueToken({
  userId,
  email,
  sessionId,
  roles,
  modules,
  dataAccessibilityLevel,
  type
}) {
  let token = '';

  const roleTypes = roles.filter(role => role.isActive && !role.isArchived)?.map(role => role.roleType);

  let tokenData = {
    userId,
    email,
    modules,
    sessionId,
    dataAccessibilityLevel,
    roleTypes,
    type
  };

  try {
    token = jwt.sign(
      tokenData,
      process.env.JWT_SECRETKEY,
      { expiresIn: process.env.TOKEN_EXP_TIME || '48h' }
    );
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    return next(error);
  }
  return token;
};

async function updateUserToken(accessToken) {
  try {
    const tokenCreation = new Date();
    const token = {
      accessToken,
      tokenCreation,
      tokenExpiry: new Date(tokenCreation.getTime() + 48 * 60 * 60 * 1000),
    };
    return token;
  } catch (error) {
    throw error;
  }
}

async function addAccessLog(actionType, requestedLogin, userID, ip = null, userInfo) {
  let existsButNotAuthCode = 470;
  if (userInfo && !_.isEmpty(userInfo) && actionType == 'existsButNotAuth') {
    const isValidRole = userInfo.roles.some(role => role.isActive === true && role.isArchived === false);
    existsButNotAuthCode = userInfo.customer.type != 'SP' ? "452" : userInfo.customer.isActive == false ? "453" : userInfo.customer.isArchived == true ? "454" :
      userInfo.isActive == false ? "455" : userInfo.isArchived == true ? "456" :
        userInfo?.contact?.isActive == false ? "457" : userInfo?.contact?.isArchived == true ? "458" :
          (_.isEmpty(userInfo.roles) || !isValidRole) ? "459" :
            !(typeof userInfo.lockUntil === "undefined" || userInfo.lockUntil == null || new Date() >= userInfo.lockUntil) ? "460" : "405";
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

async function removeSessions(userId) {
  await Promise.all([
    SecuritySession.deleteMany({ "session.user": userId }),
    SecuritySession.deleteMany({ "session.user": { $exists: false } }),
    SecurityUser.updateOne({ _id: userId }, { token: {} })
  ]);

  const wss = getSocketConnectionByUserId(userId);
  const logoutMessage = Buffer.from(
    JSON.stringify({ eventName: "logout", userId })
  );

  wss.filter((ws) => ws.userId === userId)
    .forEach((ws) => {
      ws.send(logoutMessage);
      ws.terminate();
    });
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function removeAndCreateNewSession(req, userId) {
  try {
    await removeSessions(userId);
    if (req.session) {
      req.session.cookie.expires = false;
      let maxAge = process.env.TOKEN_EXP_TIME || "48h";
      maxAge = maxAge.replace(/\D/g, '');
      req.session.cookie.maxAge = maxAge * 60 * 60 * 1000;
      req.session.isLoggedIn = true;
      req.session.user = userId;
      req.session.sessionId = req.sessionID;

      await req.session.save();
      await delay(500);
      let user = await SecuritySession.findOne({ "session.user": userId });
      return user;
    }
    else {
      return false;
    }
  } catch (err) {
    logger.error(new Error(err));
    return next(new Error('User session creation failed!'));
  }
}

function isValidCustomer(customer) {
  if (_.isEmpty(customer) ||
    customer.type != 'SP' ||
    customer.isActive == false ||
    customer.isArchived == true) {
    return false;
  }
  return true;
}


function isValidUser(user) {
  if (_.isEmpty(user) ||
    user.isActive == false ||
    user.isArchived == true) {
    return false;
  }
  return true;
}

function isValidContact(contact) {
  if (!_.isEmpty(contact)) {
    if (contact.isActive == false || contact.isArchived == true) {
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

module.exports = {
  generateRandomString,
  isTokenExpired,
  comparePasswords,
  issueToken,
  updateUserToken,
  addAccessLog,
  removeSessions,
  removeAndCreateNewSession,
  isValidUser,
  isValidCustomer,
  isValidContact,
  isValidRole,
  validateRecaptcha
}