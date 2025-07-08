const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
const _ = require('lodash');
let rtnMsg = require('../../config/static/static');
const {
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
} = require('../service/authHelper');
const { SecurityUser, SecuritySignInLog, SecurityConfigBlackListIP, SecurityConfigWhiteListIP, SecurityConfigBlockedCustomer, SecurityConfigBlockedUser, SecuritySession } = require('../models');
const { CustomerContact } = require('../../crm/models');
const ipRangeCheck = require("ip-range-check");
let securityDBService = require('../service/securityDBService');
const dbService = this.dbservice = new securityDBService();
const emailService = require('../service/userEmailService');
const userEmailService = this.userEmailService = new emailService();

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.clientURL = process.env.ADMIN_PORTAL_APP_URL;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'customer', select: 'name type modules isActive isArchived' },
  { path: 'contact', select: 'name isActive isArchived' },
  { path: 'roles', select: '' },
];

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  var _this = this;

  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));

  } else {
    if (process.env.RECAPCHA_SECRET_KEY) {
      await validateRecaptcha({ req, res })
    }
    let queryString = { $or: [{ login: req.body.email }, { email: req.body.email }], isArchived: false };

    let blackListIP = await SecurityConfigBlackListIP.find({ isActive: true, isArchived: false });

    let matchedBlackListIps = false;
    blackListIP.forEach((ipObj) => {
      if (clientIP == ipObj.blackListIP) {
        matchedBlackListIps = true;
      } else if (ipRangeCheck(clientIP, ipObj.blackListIP)) {
        matchedBlackListIps = true;
      }
    });


    let matchedwhiteListIPs = true;
    // if (!matchedBlackListIps) {
    //   let validIps = await SecurityConfigWhiteListIP.find({ isActive: true, isArchived: false });
    //   if (validIps && validIps.length > 0) {
    //     validIps.forEach((ipObj) => {
    //       if (clientIP == ipObj.whiteListIP) {
    //         matchedwhiteListIPs = true;
    //       } else if (ipRangeCheck(clientIP, ipObj.whiteListIP)) {
    //         matchedwhiteListIPs = true;
    //       }
    //     });
    //   } else {
    //     matchedwhiteListIPs = true;
    //   }
    // }


    if (matchedwhiteListIPs && !matchedBlackListIps) {
      this.dbservice.getObject(SecurityUser, queryString, this.populate, getObjectCallback);
      async function getObjectCallback(error, response) {

        if (error) {
          logger.error(new Error(error));
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          const existingUser = response;
          if (!(_.isEmpty(existingUser)) && isValidCustomer(existingUser.customer) && isValidUser(existingUser) && isValidContact(existingUser.contact) && isValidRole(existingUser.roles) &&
            (typeof existingUser.lockUntil === "undefined" || existingUser.lockUntil == null || new Date() >= existingUser.lockUntil)
          ) {
            let blockedCustomer = await SecurityConfigBlockedCustomer.findOne({ blockedCustomer: existingUser.customer._id, isActive: true, isArchived: false });
            if (blockedCustomer) {
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
              if (blockedUser) {
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
            if (passwordsResponse) {

              if (existingUser && existingUser.loginFailedCounts && existingUser.loginFailedCounts > 0) {
                let updateUser = {
                  lockUntil: "",
                  lockedBy: "",
                  loginFailedCounts: 0,
                };

                _this.dbservice.patchObject(SecurityUser, existingUser._id, updateUser, callbackPatchFunc);
                async function callbackPatchFunc(error, response) {
                  if (error) {
                    logger.error(new Error(error));
                  }
                }
              }

              return await validateAndLoginUser(req, res, existingUser);
            }
            else {
              const minutesToWaitUntil = 15;
              if (existingUser && existingUser.loginFailedCounts &&
                ((existingUser.loginFailedCounts == 2 && (!existingUser.lockUntil || new Date() >= existingUser.lockUntil)) || existingUser.loginFailedCounts == 4)) {
                var now = new Date();
                lockUntil = new Date(now.getTime() + minutesToWaitUntil * 60 * 1000);

                if (existingUser.loginFailedCounts == 4)
                  lockUntil.setFullYear(lockUntil.getFullYear() + 100);

                let updateUser = {
                  lockUntil: lockUntil,
                  lockedBy: "System"
                };

                _this.dbservice.patchObject(SecurityUser, existingUser._id, updateUser, callbackPatchFunc);
                async function callbackPatchFunc(error, response) {
                  if (error) {
                    logger.error(new Error(error));
                  }
                }
              }

              if (!(_.isEmpty(existingUser))) {
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
            if (existingUser) {
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

            if (existingUser.lockUntil && existingUser.lockUntil > new Date()) {
              const diffInMinutes = parseInt((existingUser.lockUntil - new Date()) / (1000 * 60) + 1);
              return res.status(470).send(rtnMsg.recordCustomMessageJSON(470, diffInMinutes > 525600 ? "User Blocked!" : `Please wait for ${diffInMinutes} mintues. As attempts limit exceeded!`, true));
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
          res.status(StatusCodes.UNAUTHORIZED).send("Access to this resource is forbidden" + (!matchedwhiteListIPs ? "." : "!"));
        }
      }
    }
  }
};

exports.multifactorverifyCode = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let existingUser = await this.dbservice.getObject(SecurityUser, { _id: req.body.userID }, this.populate);
    const userContacts = await this.dbservice.getObjectList(req, CustomerContact, this.fields, { customer: existingUser?.customer?._id });

    if (existingUser) {
      if (existingUser.multiFactorAuthenticationCode == req.body.code) {
        const currentTime = new Date();
        const multiFactorAuthenticationExpireTime = new Date(existingUser.multiFactorAuthenticationExpireTime);
        if (currentTime <= multiFactorAuthenticationExpireTime) {
          const userSession = await SecuritySession.findOne({ "session.user": existingUser._id?.toString() });
          if (userSession) {
            return res.json({
              accessToken: existingUser?.token?.accessToken,
              userId: existingUser._id,
              sessionId: userSession.session.sessionId,
              user: {
                login: existingUser.login,
                email: existingUser.email,
                displayName: existingUser.name,
                customer: existingUser?.customer?._id,
                contact: existingUser?.contact?._id,
                roles: existingUser.roles,
                modules: existingUser?.customer?.modules || [],
                dataAccessibilityLevel: existingUser.dataAccessibilityLevel
              },
              userContacts,
            });
          } else {
            return res.status(StatusCodes.BAD_REQUEST).send("Authentication Failed!");
          }
        }
        else {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'The code is no longer valid.', true));
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid code', true));
      }
    }
    else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Code not found', true));
    }
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    var _this = this;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    let existingUser = await this.dbservice.getObject(SecurityUser, { _id: req.body.userID }, this.populate);

    if (!existingUser?._id) {
      return res.status(StatusCodes.BAD_REQUEST).send('User not found');
    }
    const accessToken = await issueToken({
      userId: existingUser._id,
      email: existingUser.login,
      sessionId: req.sessionID,
      roles: existingUser.roles,
      modules: existingUser?.customer?.modules || [],
      dataAccessibilityLevel: existingUser.dataAccessibilityLevel,
      type: existingUser?.customer?.type
    });

    if (accessToken) {
      const token = await updateUserToken(accessToken);
      await this.dbservice.patchObject(SecurityUser, existingUser._id, { token });
      const userContacts = await this.dbservice.getObjectList(req, CustomerContact, this.fields, { customer: existingUser?.customer?._id });

      const userSession = await SecuritySession.findOne({ "session.user": existingUser._id?.toString() });
      return res.json({
        accessToken,
        userId: existingUser._id,
        sessionId: userSession.session.sessionId,
        user: {
          login: existingUser.login,
          email: existingUser.email,
          displayName: existingUser.name,
          roles: existingUser.roles,
          modules: existingUser?.customer?.modules || [],
          customer: existingUser?.customer?._id,
          type: existingUser?.customer?.type,
          contact: existingUser?.contact?._id,
          dataAccessibilityLevel: existingUser.dataAccessibilityLevel,
        },
        userContacts,
      });
    }
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message);
  }
};

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
  wss.map((ws) => {
    ws.send(Buffer.from(JSON.stringify({ 'eventName': 'userLoggedOut', userId: req.params.userID })));
  });

  if (req.session) {
    req.session.isLoggedIn = false;
    req.session.destroy((a, b, c) => {
      return res.status(StatusCodes.OK).send(rtnMsg.recordLogoutMessage(StatusCodes.OK));
    })
  } else {
    return res.status(StatusCodes.OK).send(rtnMsg.recordLogoutMessage(StatusCodes.OK));
  }

};

exports.forgetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let existingUser = await this.dbservice.getObject(SecurityUser, { login: req.body.email, isActive: true, isArchived: false }, this.populate);
    if (existingUser) {
      await this.userEmailService.resetPasswordEmail(req, res, existingUser)
    } else {
      res.status(StatusCodes.BAD_REQUEST).send('Unable to locate the system user');
    }
  }
};


exports.verifyForgottenPassword = async (req, res, next) => {
  try {
    let _this = this;
    const existingUser = await SecurityUser.findById(req.body.userId)
      .populate(this.populate);
    if (existingUser) {
      if (existingUser.token && existingUser.token.accessToken == req.body.token) {
        const tokenExpired = await isTokenExpired(existingUser.token.tokenExpiry);
        if (!tokenExpired) {
          const hashedPassword = await bcrypt.hash(req.body.password, 12);
          this.dbservice.patchObject(SecurityUser, existingUser._id, { password: hashedPassword, token: {} }, callbackPatchFunc);
          async function callbackPatchFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
            } else {
              await _this.userEmailService.passwordUpdatedEmail(req, res, existingUser)
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).send('Token Expired!');
        }
      }
      else {
        res.status(StatusCodes.BAD_REQUEST).send('Token Invalid!');
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

async function validateAndLoginUser(req, res, existingUser) {
  try {

    const accessToken = await issueToken({
      userId: existingUser._id,
      email: existingUser.login,
      sessionId: req.sessionID,
      roles: existingUser.roles,
      modules: existingUser?.customer?.modules || [],
      dataAccessibilityLevel: existingUser.dataAccessibilityLevel,
      type: existingUser?.customer?.type
    });

    if (!accessToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const session = await removeAndCreateNewSession(req, existingUser._id.toString());

    if (!session || !session.session || !session.session.sessionId) {
      throw new Error("Unable to start session.");
    }

    const token = await updateUserToken(accessToken);
    await dbService.patchObject(SecurityUser, existingUser._id, { token });
    const querySecurityLog = {
      user: existingUser._id,
      logoutTime: { $exists: false },
      statusCode: 200,
    };

    await SecuritySignInLog.updateMany(querySecurityLog, {
      $set: { logoutTime: new Date(), loggedOutBy: "SYSTEM" },
    });

    const loginLogResponse = await addAccessLog(
      "login",
      req.body.email,
      existingUser._id,
      (req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress)
    );
    await dbService.postObject(loginLogResponse);

    const wss = getAllWebSockets();
    wss?.forEach((ws) => {
      ws.send(
        Buffer.from(
          JSON.stringify({ eventName: "newUserLogin", userId: existingUser._id })
        ));
    });

    if (existingUser.multiFactorAuthentication) {
      return await userEmailService.sendMfaEmail(req, res, existingUser);
    }
    const userContacts = await CustomerContact.find({ isActive: true, isArchived: false, customer: existingUser?.customer?._id });
    const userSession = await SecuritySession.findOne({ "session.user": existingUser._id?.toString() });
    const userResponse = {
      accessToken,
      userId: existingUser._id,
      sessionId: userSession.session.sessionId,
      user: {
        login: existingUser.login,
        email: existingUser.email,
        displayName: existingUser.name,
        customer: existingUser.customer?._id,
        contact: existingUser.contact?._id,
        roles: existingUser.roles,
        modules: existingUser?.customer?.modules || [],
        dataAccessibilityLevel: existingUser.dataAccessibilityLevel,
      },
      userContacts,
    };

    return res.json(userResponse);
  } catch (error) {
    logger.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(error.message || "An error occurred during login.");
  }
}

