const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const { render } = require('template-file');
const _ = require('lodash');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
const awsService = require('../../../../appsrc/base/aws');
let rtnMsg = require('../../config/static/static')
let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();
const emailService = require('../service/userEmailService');
const userEmailService = this.userEmailService = new emailService();

const { SecurityUser, SecurityRole, SecuritySignInLog, SecuritySession, SecurityUserInvite } = require('../models');
const { Customer } = require('../../crm/models');
const { Product } = require('../../products/models');

const ObjectId = require('mongoose').Types.ObjectId;
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };  
this.populate = [
  { path: "createdBy", select: "name" },
  { path: "updatedBy", select: "name" },
  { path: "customer", select: "name type isActive" },
  { path: "registrationRequest", select: "customerName contactPersonName" },
  { path: "contact", select: "firstName lastName formerEmployee isActive" },
  { path: "roles", select: "" },
  {
    path: "regions",
    populate: {
      path: "countries",
      select: "country_name as name",
    },
  },
  { path: "customers", select: "" },
  { path: "machines", select: "" },
];

this.populateList = [
  { path: "customer", select: "name type" },
  {
    path: "contact",
    select: "firstName lastName formerEmployee reportingTo",
    populate: {
      path: "department",
      select: "departmentName departmentType",
    },
  },
  { path: "registrationRequest", select: "customerName contactPersonName" },
  { path: "roles", select: "" },
];

exports.validateUser = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.dbservice.getObject(SecurityUser, this.query, this.populate, callbackFunc);
  function callbackFunc(error, user) {
    if (error) {
      logger.error(new Error(error));s
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      if(user?.login){
        return res.status(StatusCodes.BAD_REQUEST).send("Email Already Exist!");
      } 
      return res.status(StatusCodes.ACCEPTED).send("Email available!");
    }
  }
};

const getSecurityUser = async (req, res, next) => {
  this.dbservice.getObjectById(SecurityUser, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, user) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const wss = getSocketConnectionByUserId(user._id);
      user.isOnline = false;

      if(Array.isArray(wss) && wss.length>0 && wss[0].userData._id) {
        user = JSON.parse(JSON.stringify(user));
        user.isOnline = true;
      }
      res.json(user);
    }
  }
};

exports.getSecurityUser = getSecurityUser;

exports.getSecurityUsers = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  if (req.query.roleType) {
    let filteredRoles = await SecurityRole.find({ roleType: { $in: req.query.roleType }, isActive: true, isArchived: false });

    if (Array.isArray(filteredRoles) && filteredRoles.length > 0) {
      let filteredRolesIds = filteredRoles.map((r) => r._id);
      this.query.roles = { $in: filteredRolesIds };
    }
    delete this.query.roleType;
    delete req.query.roleType;
  }

  // In case to fetch only specified fields
  if (req.query.fields) {
    this.fields = req.query.fields.split(',').join(' ');
    delete req.query.fields;
  } else this.fields = {}

  // In case customer type is passed
  const customerType = req.query.customer && req.query.customer.type;
  delete this.query.customer;

  // In case contact department type is passed
  const departmentType = req.query.contact?.department?.departmentType;
  delete this.query.contact;

  this.dbservice.getObjectList(req, SecurityUser, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, users) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      users = JSON.parse(JSON.stringify(users));

      // Filter users based on customer type
      if (customerType) {
        users = users.filter((user) => user.customer && user.customer.type === customerType);
      }

      // Filter users based on department type
      if (departmentType) {
        users = users.filter((user) => user.contact?.department && user.contact?.department?.departmentType === departmentType);
      }

      let i = 0;
      for (let user of users) {
        const wss = getSocketConnectionByUserId(user._id);
        users[i].isOnline = false;

        if (Array.isArray(wss) && wss.length > 0 && wss[0].userData._id) {
          users[i].isOnline = true;
        }

        i++;
      }
      res.json(users);
    }
  }

};

exports.deleteSecurityUser = async (req, res, next) => {

  let user = await SecurityUser.findById(req.params.id); 
  if(!(_.isEmpty(user)) && user.isArchived) {
    
    let customer = await Customer.findOne({createdBy:user.id});
    let machine = await Product.findOne({createdBy:user.id});

    if(!customer && !machine) {
      this.dbservice.deleteObject(SecurityUser, req.params.id, res, (error, result)=>{
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      });
    }
    else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'User assigned to a Customer/Machine cannot be deleted!'));
    }
  }
  else {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }
};

exports.postSecurityUser = async ( req, res ) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } 

    if(!req.body.email) req.body.email = req.body.login;
    if(!req.body.login) req.body.login = req.body.email;
    
    let queryString = { 
      isArchived: false, 
      $or: [
        { email: req.body.email?.toLowerCase()?.trim() },
        { login: req.body.login?.toLowerCase()?.trim() }
      ]
    };

    const existingUser = await SecurityUser.findOne(queryString);
    if(existingUser) {
      return res.status(StatusCodes.CONFLICT).send("Email/Login already exists!");
    }

    const doc = await getDocumentFromReq(req, "new");
    const newUser = await this.dbservice.postObject(doc);
    return res.status(StatusCodes.CREATED).json({ user: newUser });    
  } catch(error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("User save failed!");
    throw error;
  }
};

exports.patchSecurityUser = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if (ObjectId.isValid(req.params.id)) {
      let loginUser =  await this.dbservice.getObjectById(SecurityUser, this.fields, req.body.loginUser.userId, this.populate);
      // const hasSuperAdminRole = loginUser.roles.some(role => role.roleType === 'SuperAdmin');
      let hasSuperAdminRole = false;
      if(req.body.loginUser?.roleTypes?.includes("SuperAdmin") || 
          req.body.loginUser?.roleTypes?.includes("Developer")) {
          hasSuperAdminRole = true;
      }

      if (req.url.includes("updatePassword")) {
        // if admin is updating password
        if(req.body.isAdmin){ 
          if(req.body.loginUser.userId){
            // let loginUser =  await this.dbservice.getObjectById(SecurityUser, this.fields, req.body.loginUser.userId, this.populate);
            // const hasSuperAdminRole = loginUser.roles.some(role => role.roleType === 'SuperAdmin');
            if(!hasSuperAdminRole){
              return res.status("Only superadmins are allowed to access this feature");
            }
          }else{
            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }else{
          // if the user is updating their password
          let queryString  = { _id: req.params.id };
          let existingUser = await this.dbservice.getObject(SecurityUser, queryString, this.populate);
          if(existingUser){
            const passwordsResponse = await comparePasswords(req.body.oldPassword, existingUser.password)
            if(!passwordsResponse){ 
              return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, "Wrong password entered", true));  
            }   
          }else{
            return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, "User not found!", true));
          }  
        }
        req.body.password = req.body.newPassword;
        const doc = await getDocumentFromReq(req);
        _this.dbservice.patchObject(SecurityUser, req.params.id, doc, callbackFunc);
        function callbackFunc(error, result) {
          if (error) {
            logger.error(new Error(error));
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          } else {
            return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result, "passwordChange"));
          }
        }   
      } else {
        // delete(archive) user
        if("isArchived" in req.body){
          let user = await SecurityUser.findById(req.params.id); 
          if(!(_.isEmpty(user))) {        
            if(req.body.loginUser?.userId == user._id || !hasSuperAdminRole){
              return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, "User is not authorized to access this feature!", true));
            } 
            else {
              if( user?.isArchived && !req.body?.isArchived ){
                const userAvailability = await SecurityUser.findOne({ login: user.login, isArchived: false }).lean();
                if( userAvailability ){
                  return res.status(StatusCodes.CONFLICT).send("Email/Login already exists!");
                }
              }
            const doc = await getDocumentFromReq(req);
            _this.dbservice.patchObject(SecurityUser, req.params.id, doc, callbackFunc);
              function callbackFunc(error, result) {
                if (error) {
                  logger.error(new Error(error));
                  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                } else {
                  return getSecurityUser(req, res )
                }
              }
            }

          } else {
            return res.status(StatusCodes.BAD_REQUEST).send("User not found!");
          }

        } else {
          // Only superadmin/logged in user can update
          if(hasSuperAdminRole || req.body.loginUser.userId == req.params.id){
            // check if email already exists
            let queryString = {
              isArchived: false,
              _id: { $ne: req.params.id },
              $or: [
                { email: { $regex: req.body.email?.toLowerCase()?.trim(), $options: 'i' } },
                { email: { $regex: req.body.login?.toLowerCase()?.trim(), $options: 'i' } },
                { login: { $regex: req.body.email?.toLowerCase()?.trim(), $options: 'i' } },
                { login: { $regex: req.body.login?.toLowerCase()?.trim(), $options: 'i' } }
              ]
            };

            
            this.dbservice.getObject(SecurityUser, queryString, this.populate, getObjectCallback);
            async function getObjectCallback(error, response) {
              if (error) {
                logger.error(new Error(error));
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
              } else {
                // check if theres any other user by the same email
                if(response && response._id && response._id != req.params.id){
                  // return error message
                  if (req.body.login && req.body.email) {
                    return res.status(StatusCodes.CONFLICT).send("Email/Login already exists!");
                  } else if (req.body.login) {
                    return res.status(StatusCodes.CONFLICT).send("Login already exists!");
                  } else if (req.body.email) {
                    return res.status(StatusCodes.CONFLICT).send("Email already exists!");
                  } else {
                    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
                  }
                  // return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST))       
                } else {
                  const doc = await getDocumentFromReq(req);
                  _this.dbservice.patchObject(SecurityUser, req.params.id, doc, callbackFunc);
                  function callbackFunc(error, result) {
                    if (error) {
                      return logger.error(new Error(error));
                      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                    } else {
                      return getSecurityUser(req, res )
                    }
                  }     
                }
              }
            } 
          }else{
            return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, "User is not authorized to access this feature!", true));
          }
        }
      }
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
    }
  }
};

exports.changeLockedStatus = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if (ObjectId.isValid(req.params.id)) {
      let loginUser =  await this.dbservice.getObjectById(SecurityUser, this.fields, req.body.loginUser.userId, this.populate);
      const hasSuperAdminRole = loginUser.roles.some(role => role.roleType === 'SuperAdmin');

      if (hasSuperAdminRole) {

        let fieldToUpdate = {
        }

        var now = new Date();

        let lockUntil = 0;
        if(!isNaN(req.params.minutes)) {
          if(req.params.minutes > 0) {
            lockUntil = new Date(now.getTime() + req.params.minutes * 60 * 1000);
          } else {
            lockUntil = new Date(now.getTime() + req.params.minutes * 60 * 1000);
            now.setFullYear(now.getFullYear() + 100);
            lockUntil = now;
          }
        } else {
            lockUntil = new Date(now.getTime() + 15 * 60 * 1000);
        }

      
        if(req.params.status === 'true') {
          fieldToUpdate.lockedBy = "ADMIN";
          fieldToUpdate.lockUntil = lockUntil
        } else {
          fieldToUpdate.lockedBy = "",
          fieldToUpdate.lockUntil = "",
          fieldToUpdate.loginFailedCounts = 0
        };


        _this.dbservice.patchObject(SecurityUser, req.params.id, fieldToUpdate, callbackFunc);
        function callbackFunc(error, result) {
          if (error) {
            logger.error(new Error(error));
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          } else {
            return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result, "User unlocked successfully"));
          }
        }   
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send("Super user previligies not found!");
      }
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
    }
  }
};

exports.addSecurityUserForPortalRegistration = async (req, res) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } 

    if(!req.body.email) req.body.email = req.body.login;
    if(!req.body.login) req.body.login = req.body.email;
    if(req.body.isInvite) req.body.isActive = false;
    
    let queryString = { 
      isArchived: false, 
      $or: [
        { email: req.body.email?.toLowerCase()?.trim() },
        { login: req.body.login?.toLowerCase()?.trim() }
      ]
    };
    const user = await this.dbservice.getObject(SecurityUser, queryString, this.populate );

    if(_.isEmpty(user)){
      const doc = await getDocumentFromReq( req, "new"  );
      const newUser = await this.dbservice.postObject( doc );
      return newUser;
    } else {
      return res.status(StatusCodes.CONFLICT).send("Email/Login already exists!");
    }
  } catch(error){
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("User save failed!");
    throw error;
  }
}


async function comparePasswords(encryptedPass, textPass, next){
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(encryptedPass, textPass);
    return isValidPassword;
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    return next(error);
  }
};


async function getDocumentFromReq(req, reqType) {
  const {
    customer,
    customers,
    contact,
    name,
    phone,
    email,
    currentEmployee,
    login,
    dataAccessibilityLevel,
    regions,
    machines,
    password,
    registrationRequest,
    expireAt,
    roles,
    isActive,
    isArchived,
    multiFactorAuthentication,
    multiFactorAuthenticationCode,
    multiFactorAuthenticationExpireTime,
  } = req.body;

  let doc = {};

  if (reqType && reqType === "invite") {
    doc = new SecurityUserInvite({});
    // Add invitation specific fields
    doc.inviteCode = (Math.random() + 1).toString(36).substring(7);
    let inviteCodeExpireHours = parseInt(process.env.INVITE_EXPIRE_HOURS) || 48;
    doc.inviteExpireTime = new Date(Date.now() + inviteCodeExpireHours * 60 * 60 * 1000);
    doc.senderUser = req.body.loginUser.userId;
    doc.lastInviteSentAt = new Date();
  }

  if (reqType && reqType == "new") {
    doc = new SecurityUser({});
  }
  
  if ("customer" in req.body) doc.customer = customer;
  if ("contact" in req.body) doc.contact = contact;
  if ("name" in req.body) doc.name = name;
  if ("phone" in req.body) doc.phone = phone;
  if ("login" in req.body) doc.login = login?.toLowerCase()?.trim();
  if ("email" in req.body) doc.email = email?.toLowerCase()?.trim();
  if ("currentEmployee" in req.body) doc.currentEmployee = currentEmployee;
  if ("roles" in req.body) doc.roles = roles;
  if ("dataAccessibilityLevel" in req.body) doc.dataAccessibilityLevel = dataAccessibilityLevel;
  if ("regions" in req.body) doc.regions = regions;
  if ("customers" in req.body) doc.customers = customers;
  if ("machines" in req.body) doc.machines = machines;


  if ("multiFactorAuthentication" in req.body) {
    doc.multiFactorAuthentication = multiFactorAuthentication;
  }

  if ("multiFactorAuthenticationCode" in req.body) {
    doc.multiFactorAuthenticationCode = multiFactorAuthenticationCode;
  }
  if ("multiFactorAuthenticationExpireTime" in req.body) {
    doc.multiFactorAuthenticationExpireTime = multiFactorAuthenticationExpireTime;
  }

  if ("registrationRequest" in req.body) doc.registrationRequest = registrationRequest;
  if ("expireAt" in req.body) doc.expireAt = expireAt;

  if ("isActive" in req.body) doc.isActive = isActive;
  if ("isArchived" in req.body) doc.isArchived = isArchived;
  if ("userLocked" in req.body) doc.userLocked = userLocked;
  if ("lockUntil" in req.body) doc.lockUntil = lockUntil;
  if ("lockedBy" in req.body) doc.lockedBy = lockedBy;

  if ("password" in req.body) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      doc.password = hashedPassword;
    } catch (error) {
      logger.error(new Error(error));
      throw new Error(error);
    }
  }


  // if ("invitationStatus" in req.body) {
  //   doc.invitationStatus = invitationStatus;
  // }

  if (customer) {
    const customerId = typeof customer === 'string' ? customer : customer?._id;
    const uniqueCustomers = new Set(doc.customers || []);
    if (typeof customerId === 'string' && !uniqueCustomers.has(customerId)) {
      uniqueCustomers.add(customerId);
      doc.customers = Array.from(uniqueCustomers);
    }
  }

  if ("loginUser" in req.body) {
    if (reqType === "new" || reqType === "invite") {
      doc.createdBy = req.body.loginUser.userId;
      doc.updatedBy = req.body.loginUser.userId;
      doc.createdIP = req.body.loginUser.userIP;
      doc.updatedIP = req.body.loginUser.userIP;
    } else {
      doc.updatedBy = req.body.loginUser.userId;
      doc.updatedIP = req.body.loginUser.userIP;
    }
  }

  return doc;
}