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
const { SecurityUser, SecuritySignInLog, SecurityConfigBlackListIP, SecurityConfigWhiteListIP, SecurityConfigBlockedCustomer, SecurityConfigBlockedUser, SecuritySession } = require('../models');
const ipRangeCheck = require("ip-range-check");


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
  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  var _this = this;

  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));

  } else {
    let queryString = { $or:[{login: req.body.email}, {email: req.body.email}], isArchived: false };

    let blackListIP = await SecurityConfigBlackListIP.find({isActive: true, isArchived: false });

    let matchedBlackListIps = false;
    blackListIP.forEach((ipObj) => {
      if(clientIP == ipObj.blackListIP) {
        matchedBlackListIps = true;
      } else if(ipRangeCheck(clientIP, ipObj.blackListIP)){
        matchedBlackListIps = true;
      }
    });


    let matchedwhiteListIPs = false;
    if(!matchedBlackListIps) {
      let validIps = await SecurityConfigWhiteListIP.find({ isActive: true, isArchived: false });
      if(validIps && validIps.length > 0) {
        validIps.forEach((ipObj) => {
          if(clientIP == ipObj.whiteListIP) {
            matchedwhiteListIPs = true;
          } else if(ipRangeCheck(clientIP, ipObj.whiteListIP)){
            matchedwhiteListIPs = true;
          }
        });  
      } else {
        matchedwhiteListIPs = true;
      }
    }


    if(matchedwhiteListIPs && !matchedBlackListIps){
      this.dbservice.getObject(SecurityUser, queryString, [{ path: 'customer', select: 'name type isActive isArchived' }, { path: 'contact', select: 'name isActive isArchived' }, {path: 'roles', select: ''}], getObjectCallback);
      async function getObjectCallback(error, response) {

        if (error) {
          logger.error(new Error(error));
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          const existingUser = response;

          if (!(_.isEmpty(existingUser)) && isValidCustomer(existingUser.customer) && isValidUser(existingUser)  && isValidContact(existingUser.contact) && isValidRole(existingUser.roles) && 
          (typeof existingUser.lockUntil === "undefined" || existingUser.lockUntil == null || new Date() >= existingUser.lockUntil)
          ) {

            //Checking blocked list of customer & users.
            let blockedCustomer = await SecurityConfigBlockedCustomer.findOne({ blockedCustomer: existingUser.customer._id, isActive: true, isArchived: false });
            

            if(blockedCustomer) {
              const securityLogs = await addAccessLog('blockedCustomer', req.body.email, existingUser._id, clientIP);
              dbService.postObject(securityLogs, callbackFunc);
              async function callbackFunc(error, response) {
                if (error) {
                  logger.error(new Error(error));
                }
              }
              return res.status(StatusCodes.BAD_GATEWAY).send("Not authorized customer to access!!");
            } else {
              let blockedUser = await SecurityConfigBlockedUser.findOne({ blockedUser: existingUser._id, isActive: true, isArchived: false });
              if(blockedUser) {
                securityLogs = await addAccessLog('blockedUser', req.body.email, existingUser._id, clientIP);
                dbService.postObject(securityLogs, callbackFunc);
                async function callbackFunc(error, response) {
                  if (error) {
                    logger.error(new Error(error));
                  }
                }
                return res.status(StatusCodes.BAD_GATEWAY).send("Not authorized user to access!!");
              }  
            }

                let passwordsResponse = await comparePasswords(req.body.password, existingUser.password);
                if(passwordsResponse) {

                  if(existingUser && existingUser.loginFailedCounts && existingUser.loginFailedCounts > 0) {
                    let updateUser = {
                      lockUntil : "",
                      lockedBy : "",
                      loginFailedCounts: 0,
                    };
      
                    _this.dbservice.patchObject(SecurityUser, existingUser._id, updateUser, callbackPatchFunc);
                    async function callbackPatchFunc(error, response) {
                      if (error) {
                        logger.error(new Error(error));
                      }
                    }
                  }
  
                  if (existingUser.multiFactorAuthentication) {
  
                    // User has enabled MFA, so redirect them to the MFA page
                    // Generate a one time code and send it to the user's email address
                    const code = Math.floor(100000 + Math.random() * 900000);
                    
                    let emailContent = `We detected an unusual 
                    sign-in from a device or location you don't usually use. If this was you, 
                    enter the code below to sign in. <br>
                    <h2 style="font-size: 30px;letter-spacing: 10px;font-weight: bold;">${code}</h2><br>.
                    The code will expire in <b>10</b> minutes.`;
                    let emailSubject = "Multi-Factor Authentication Code";
  
                    let params = {
                      to: `${existingUser.email}`,
                      subject: emailSubject,
                      html: true
                    };
  
                    
                    let username = existingUser.name;
  
                    let hostName = 'portal.howickltd.com';
  
                    if(process.env.CLIENT_HOST_NAME)
                      hostName = process.env.CLIENT_HOST_NAME;
                    
                    let hostUrl = "https://portal.howickltd.com";
  
                    if(process.env.CLIENT_APP_URL)
                      hostUrl = process.env.CLIENT_APP_URL;
                    
                    fs.readFile(__dirname+'/../../email/templates/footer.html','utf8', async function(err,data) {
                      let footerContent = render(data,{ username, emailSubject, emailContent, hostName, hostUrl })
        
                      fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {
                        let htmlData = render(data,{ username, emailSubject, emailContent, hostName, hostUrl, footerContent})
                        params.htmlData = htmlData;
                        let response = await awsService.sendEmail(params);
                      })
                    })
                    const emailResponse = await addEmail(params.subject, params.htmlData, existingUser, params.to);
                    _this.dbservice.postObject(emailResponse, callbackFunc);
                    function callbackFunc(error, response) {
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
                  const minutesToWaitUntil = 15;
                  if(existingUser && existingUser.loginFailedCounts && 
                    ((existingUser.loginFailedCounts == 2   && (!existingUser.lockUntil || new Date() >= existingUser.lockUntil )) || existingUser.loginFailedCounts == 4 )) {
                    var now = new Date();
                    lockUntil = new Date(now.getTime() + minutesToWaitUntil * 60 * 1000);
                    
                    if(existingUser.loginFailedCounts == 4) 
                      lockUntil.setFullYear(lockUntil.getFullYear() + 100);

                    let updateUser = {
                      lockUntil : lockUntil,
                      lockedBy : "System"
                    };
      
                    _this.dbservice.patchObject(SecurityUser, existingUser._id, updateUser, callbackPatchFunc);
                    async function callbackPatchFunc(error, response) {
                      if (error) {
                        logger.error(new Error(error));
                      }
                    }
                  } 

                  if (!(_.isEmpty(existingUser) ))
                  {
                    const updateCount = { $inc: { loginFailedCounts: 1 } };
                    _this.dbservice.patchObject(SecurityUser, existingUser._id, updateCount, callbackPatchFunc);
                    async function callbackPatchFunc(error, response) {
                      if (error) {
                        logger.error(new Error(error));
                      }
                    }
                  }

                  const securityLogs = await addAccessLog('invalidCredentials', req.body.email, existingUser._id, clientIP);
                  dbService.postObject(securityLogs, callbackFunc);
                  async function callbackFunc(error, response) {
                    if (error) {
                      logger.error(new Error(error));
                      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                    } else {

                      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.BAD_REQUEST));
                    } 
                  }
                }
          }
          else {
            let securityLogs = null;
            if(existingUser) {
              securityLogs = await addAccessLog('existsButNotAuth', req.body.email, existingUser._id, clientIP, existingUser);
            } else {
              securityLogs = await addAccessLog('invalidRequest', req.body.email, null, clientIP);
            }
            dbService.postObject(securityLogs, callbackFunc);
            async function callbackFunc(error, response) {
              if (error) {
                logger.error(new Error(error));
              }
            }

            if(existingUser.lockUntil && existingUser.lockUntil > new Date()) {
              const diffInMinutes = parseInt((existingUser.lockUntil - new Date()) / (1000 * 60)+ 1);
              return res.status(470).send(rtnMsg.recordCustomMessageJSON(470, diffInMinutes > 525600 ? "User Blocked!":`Please wait for ${diffInMinutes} mintues. As attempts limit exceeded!`, true));
            } else {
              return res.status(470).send(rtnMsg.recordCustomMessageJSON(470, "Access denied", true));
            }
          }
          
        }
      }
    } else {
      const securityLogs = await addAccessLog('invalidIPs', req.body.email, null, clientIP);
      dbService.postObject(securityLogs, callbackFunc);
      async function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
        } else {
          res.status(StatusCodes.UNAUTHORIZED).send("Access to this resource is forbidden"+(!matchedwhiteListIPs ? ".":"!"));
        }
      }
    }
  }
};

async function validateAndLoginUser(req, res, existingUser) {
  const accessToken = await issueToken(existingUser._id, existingUser.login, req.sessionID, existingUser.roles, existingUser.dataAccessibilityLevel );
  //console.log('accessToken: ', accessToken)
  if (accessToken) {
    let updatedToken = updateUserToken(accessToken);
    
    dbService.patchObject(SecurityUser, existingUser._id, updatedToken, callbackPatchFunc);
    async function callbackPatchFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      }

      let QuerysecurityLog = {
        user: existingUser.id,
        logoutTime: {$exists: false},
        statusCode: 200
      };

      await SecuritySignInLog.updateMany(QuerysecurityLog, { $set: { logoutTime: new Date(), loggedOutBy: "SYSTEM"} }, (err, result) => {
        if (err) {
          console.error(err);
        } else {
          // console.log(result);
        }
      });

      const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
      const loginLogResponse = await addAccessLog('login', req.body.email, existingUser._id, clientIP);
      dbService.postObject(loginLogResponse, callbackFunc);
      async function callbackFunc(error, response) {

        let session = await removeAndCreateNewSession(req,existingUser.id);
        if (error || !session || !session.session || !session.session.sessionId) {
          logger.error(new Error(error));
          if(!error)
            error = 'Unable to Start session.'
          
          console.log(error, session);
          // return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error, session });
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        } else {
          const wss = getAllWebSockets();
          wss.map((ws)=> {  
            ws.send(Buffer.from(JSON.stringify({'eventName':'newUserLogin',userId: existingUser.id})));
          });

          return res.json({
            accessToken,
            userId: existingUser.id,
            sessionId:session.session.sessionId,
            user: {
              login: existingUser.login,
              email: existingUser.email,
              displayName: existingUser.name,
              customer: existingUser?.customer?._id,
              roles: existingUser.roles,
              dataAccessibilityLevel: existingUser.dataAccessibilityLevel
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
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 

async function removeAndCreateNewSession(req, userId) {

  try {
    await removeSessions(userId);

    // console.log("req.session",req.session);
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
      console.log("session not found",new Date().getTime());

      return false;
    }


  } catch (err) {
    console.error('Error saving to session storage: ', err);
    return next(new Error('Error creating user session'));
  }
}

exports.removeAndCreateNewSession = removeAndCreateNewSession;

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
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'The code is no longer valid.', true));
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid code', true));
      }
    }
    else{
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Code not found', true));
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
    const accessToken = await issueToken(existingUser._id, existingUser.login,req.sessionID, existingUser.dataAccessibilityLevel);
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
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'User not found', true));
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

exports.logout = async (req, res, next) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  let existingSignInLog = await SecuritySignInLog.findOne({ user: req.params.userID, loginIP: clientIP }).sort({ loginTime: -1 }).limit(1);
  if (existingSignInLog && !existingSignInLog.logoutTime) {

    this.dbservice.patchObject(SecuritySignInLog, existingSignInLog._id, { logoutTime: new Date(), loggedOutBy: "SELF" }, callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      }
    }
  }

  await removeSessions(req.params.userID);

  const wss = getAllWebSockets();
  wss.map((ws)=> {  
    ws.send(Buffer.from(JSON.stringify({'eventName':'userLoggedOut',userId:req.params.userID})));
  });

  // const userIds = ws.map((ws)=> ws.userId);
  // ws.map((ws)=> {
  //   ws.send(Buffer.from(JSON.stringify({'eventName':'onlineUsers',userIds})));
  // });




  
  if(req.session) {
    req.session.isLoggedIn = false;

    req.session.destroy((a,b,c) => {
      // console.log("destroy",a,b,c);
      return res.status(StatusCodes.OK).send(rtnMsg.recordLogoutMessage(StatusCodes.OK));
    })
  }
  else {
      return res.status(StatusCodes.OK).send(rtnMsg.recordLogoutMessage(StatusCodes.OK));

  }

};

exports.forgetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const existingUser = await SecurityUser.findOne({ _id: req.body.userId, isActive: true, isArchived: false })
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

          
          let emailSubject = "Reset Password";

          let params = {
            to: `${existingUser.email}`,
            subject: emailSubject,
            html: true
          };

          let username = existingUser.name;
          let hostName = 'portal.howickltd.com';

          if(process.env.CLIENT_HOST_NAME)
            hostName = process.env.CLIENT_HOST_NAME;
          
          let hostUrl = "https://portal.howickltd.com";

          if(process.env.CLIENT_APP_URL)
            hostUrl = process.env.CLIENT_APP_URL;
          

          fs.readFile(__dirname+'/../../email/templates/footer.html','utf8', async function(err,data) {
            let footerContent = render(data,{ hostName, hostUrl, username, link })
            
            fs.readFile(__dirname+'/../../email/templates/forget-password.html','utf8', async function(err,data) {
  
              let htmlData = render(data,{ hostName, hostUrl, username, link, footerContent })
              params.htmlData = htmlData;
              let response = await awsService.sendEmail(params);
            })
          });

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
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Unable to locate the system user', true));
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

              let emailContent = `Your password has been updated successfully.<br>
                              <br>Please sign in to access your account<br>`;
                              
              let emailSubject = "Password Reset Successful";

              let params = {
                to: `${existingUser.email}`,
                subject: emailSubject,
                html: true,
              };
              

              let hostName = 'portal.howickltd.com';

              if(process.env.CLIENT_HOST_NAME)
                hostName = process.env.CLIENT_HOST_NAME;
              
              let hostUrl = "https://portal.howickltd.com";

              if(process.env.CLIENT_APP_URL)
                hostUrl = process.env.CLIENT_APP_URL;

              let username = existingUser.name;
              fs.readFile(__dirname+'/../../email/templates/footer.html','utf8', async function(err,data) {
                let footerContent = render(data,{ emailSubject, emailContent, hostName, hostUrl, username })
      
                fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {
                  let htmlData = render(data,{ emailSubject, emailContent, hostName, hostUrl, username, footerContent })
                  params.htmlData = htmlData;
                  let response = await awsService.sendEmail(params);
                })
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