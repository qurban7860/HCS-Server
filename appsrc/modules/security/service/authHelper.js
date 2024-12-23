const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const securitySignInLogController = require('../controllers/securitySignInLogController');
const logger = require('../../config/logger');
const _ = require('lodash');
const { sendMfaEmail } = require('../service/userEmailService');
let securityDBService = require('../service/securityDBService');
const dbService = this.dbservice = new securityDBService();
const { SecurityUser, SecuritySignInLog, SecuritySession } = require('../models');

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
    const filteredRoles = roles.filter(role => role.isActive && !role.isArchived).map(role => role.roleType);
  
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
  
  async function validateAndLoginUser(req, res, existingUser) {
    const accessToken = await issueToken(existingUser._id, existingUser.login, req.sessionID, existingUser.roles, existingUser.dataAccessibilityLevel );
    
  if (accessToken) {
    let updatedToken = updateUserToken(accessToken);
      
      dbService.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
      async function callbackPatchFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        }
        let QuerysecurityLog = {
          user: existingUser._id,
          logoutTime: {$exists: false},
          statusCode: 200
        };
  
        await SecuritySignInLog.updateMany(QuerysecurityLog, { $set: { logoutTime: new Date(), loggedOutBy: "SYSTEM"} }, (err, result) => {
          if (err) {
            console.error(err);
          } 
        });
  
        const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
        const loginLogResponse = await addAccessLog( 'login', req.body.email, existingUser._id, clientIP );
  
        dbService.postObject(loginLogResponse, callbackFunc);
        async function callbackFunc(error, response) {
          let session = await removeAndCreateNewSession(req, existingUser?._id?.toString());
  
          if (error || !session || !session.session || !session.session.sessionId) {
            logger.error(new Error(error));
            if(!error)
              error = 'Unable to Start session.'
        
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          } else {
            const wss = getAllWebSockets();
            wss.map((ws)=> {  
              ws.send(Buffer.from(JSON.stringify({'eventName':'newUserLogin',userId: existingUser.id})));
            });
  
            if ( existingUser.multiFactorAuthentication ) { 
              return await sendMfaEmail( req, res, existingUser );
            } else{
              const userRes = {
                  accessToken,
                  userId: existingUser.id,
                  // sessionId:session.session.sessionId,
                user: {
                  login: existingUser.login,
                  email: existingUser.email,
                  displayName: existingUser.name,
                  customer: existingUser?.customer?._id,
                  contact: existingUser?.contact?._id,
                  roles: existingUser.roles,
                  dataAccessibilityLevel: existingUser.dataAccessibilityLevel
                }
              }
              return res.json( userRes );
            }
          }
        }
      }
    }
    else {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  }

  async function removeSessions(userId) {
    await SecuritySession.deleteMany({"session.user":userId});
    await SecuritySession.deleteMany({"session.user":{$exists:false}});
    const wss = getSocketConnectionByUserId(userId);
    const sessionTimeout = setTimeout(()=>{
      wss.map((ws)=> {  
        if(ws.userId==userId) {
          ws.send(Buffer.from(JSON.stringify({'eventName':'logout',userId})));
          ws.terminate();
        }
      });
      clearTimeout(sessionTimeout);
    }, 2000);
  }

  function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 
  
  async function removeAndCreateNewSession(req, userId) {
    try {
      await removeSessions(userId);
      if(req.session) {
        req.session.cookie.expires = false;
        let maxAge = process.env.TOKEN_EXP_TIME || "48h";
        maxAge = maxAge.replace(/\D/g,'');
  
        req.session.cookie.maxAge =  maxAge * 60 * 60 * 1000;
        req.session.isLoggedIn = true;
        req.session.user = userId;
        req.session.sessionId = req.sessionID;
        
        await req.session.save();
        await delay(500);
        let user = await SecuritySession.findOne({"session.user":userId});
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
  
module.exports = {
    generateRandomString,
    isTokenExpired,
    comparePasswords,
    issueToken,
    updateUserToken,
    addAccessLog,
    validateAndLoginUser,
    removeSessions,
    removeAndCreateNewSession,
    isValidUser,
    isValidCustomer,
    isValidContact,
    isValidRole,
}