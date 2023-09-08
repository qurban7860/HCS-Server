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

const { SecurityUser } = require('../models');
const { Customer } = require('../../crm/models');
const { Product } = require('../../products/models');

const ObjectId = require('mongoose').Types.ObjectId;
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'},
  {path: 'customer', select: 'name'},
  {path: 'contact', select: 'firstName lastName'},
  {path: 'roles', select: ''},
  {path: 'regions', populate: {
    path: 'countries',
    select: 'country_name as name'
  }},
  {path: 'customers', select: ''},  
  {path: 'machines', select: ''},
];

this.populateList = [
  {path: 'customer', select: 'name'},
  {path: 'contact', select: 'firstName lastName'},
  {path: 'roles', select: ''},
  // {path: 'regions', select: ''},
];


exports.getSecurityUser = async (req, res, next) => {
  this.dbservice.getObjectById(SecurityUser, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.sendUserInvite = async (req, res, next) =>{
  let user = await SecurityUser.findById(req.params.id);
  user.inviteCode = (Math.random() + 1).toString(36).substring(7);
  let expireAt = new Date().setHours(new Date().getHours() + 1);
  user.inviteExpireTime = expireAt;
  user = await user.save();

  let emailSubject = "User Invite - HOWICK";

  let emailContent = `Dear ${user.name},<br><br>Howick has invited you join howick cloud.Please click on below link and enter password for joining.<br><br>`;

  emailContent+=`${process.env.CLIENT_APP_URL}/invite/${req.params.id}/${user.inviteCode}/${expireAt}`;
  let params = {
    to: `${user.email}`,
    subject: emailSubject,
    html: true
  };
  fs.readFile(__dirname+'/../../email/templates/emailTemplate.html','utf8', async function(err,data) {
    let htmlData = render(data,{ emailSubject, emailContent })
    params.htmlData = htmlData;
    let response = await awsService.sendEmail(params);
  })
}

exports.verifyInviteCode = async (req, res, next) => {
  let user = await SecurityUser.findOne({ _id : req.params.id, inviteCode : req.params.code });
  if(!user) {
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'Invalid invitation code'));
  }
  else {
    return res.status(StatusCodes.OK).json({ valid:true });
  }

};

exports.getSecurityUsers = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.dbservice.getObjectList(SecurityUser, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
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

exports.postSecurityUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } 
  else {
    // check if email exists
    var _this = this;
    let queryString = { 
      isArchived: false, 
      $or: [
        { email: req.body.email.toLowerCase().trim() },
        { login: req.body.login.toLowerCase().trim() }
      ]
    };
    this.dbservice.getObject(SecurityUser, queryString, this.populate, getObjectCallback);
    async function getObjectCallback(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        if(_.isEmpty(response)){
          const doc = await getDocumentFromReq(req, 'new');
          _this.dbservice.postObject(doc, callbackFunc);
          function callbackFunc(error, response) {
            if (error) {
              logger.error(new Error(error));
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
            } else {
              res.status(StatusCodes.CREATED).json({ user: response });
            }
          }  
        }else{
          return res.status(StatusCodes.CONFLICT).send(rtnMsg.recordCustomMessageJSON(StatusCodes.CONFLICT, 'Email/Login already exists!', true));
        }
      }
    }
  }
};
exports.updatePasswordUser = async(req,res,next) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } 
  else {
    if (ObjectId.isValid(req.params.id)) {
      let loginUser = await this.dbservice.getObjectById(SecurityUser, this.fields, req.params.id, this.populate);
      if(loginUser) {
        loginUser.password = await bcrypt.hash(req.body.password, 12);
        await loginUser.save();
        res.status(StatusCodes.OK).json({ message: 'Password Changed Successfully' });

      }
      else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));   
      }
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
    }
  }
}
exports.patchSecurityUser = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if (ObjectId.isValid(req.params.id)) {
      let loginUser =  await this.dbservice.getObjectById(SecurityUser, this.fields, req.body.loginUser.userId, this.populate);
      const hasSuperAdminRole = loginUser.roles.some(role => role.roleType === 'SuperAdmin');

      if (req.url.includes("updatePassword")) {
        // if admin is updating password
        if(req.body.isAdmin){ 
          if(req.body.loginUser.userId){
            // let loginUser =  await this.dbservice.getObjectById(SecurityUser, this.fields, req.body.loginUser.userId, this.populate);
            // const hasSuperAdminRole = loginUser.roles.some(role => role.roleType === 'SuperAdmin');
            if(!hasSuperAdminRole){
              return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, "Only superadmins are allowed to access this feature ", true));
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
            const doc = await getDocumentFromReq(req);
            _this.dbservice.patchObject(SecurityUser, req.params.id, doc, callbackFunc);
              function callbackFunc(error, result) {
                if (error) {
                  logger.error(new Error(error));
                  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
                } else {
                  return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
                }
              }
            }

          } else {
            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }

        } else {
          // Only superadmin/logged in user can update
          if(hasSuperAdminRole || req.body.loginUser.userId == req.params.id){
            // check if email already exists
            let queryString = {
              isArchived: false,
              _id: { $ne: req.params.id },
              $or: [
                { email: { $regex: req.body.email.toLowerCase().trim(), $options: 'i' } },
                { email: { $regex: req.body.login.toLowerCase().trim(), $options: 'i' } },
                { login: { $regex: req.body.email.toLowerCase().trim(), $options: 'i' } },
                { login: { $regex: req.body.login.toLowerCase().trim(), $options: 'i' } }
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
                    return res.status(StatusCodes.CONFLICT).send(rtnMsg.recordCustomMessageJSON(StatusCodes.CONFLICT, 'Email/Login already exists!', true));
                  } else if (req.body.login) {
                    return res.status(StatusCodes.CONFLICT).send(rtnMsg.recordCustomMessageJSON(StatusCodes.CONFLICT, 'Login already exists!', true));
                  } else if (req.body.email) {
                    return res.status(StatusCodes.CONFLICT).send(rtnMsg.recordCustomMessageJSON(StatusCodes.CONFLICT, 'Email already exists!', true));
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
                      return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
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


async function getDocumentFromReq(req, reqType){
  const { customer, customers, contact, name, phone, email, currentEmployee, login, regions, machines,
     password, expireAt, roles, isActive, isArchived, multiFactorAuthentication, multiFactorAuthenticationCode,multiFactorAuthenticationExpireTime } = req.body;


  let doc = {};
  
  if (reqType && reqType == "new"){
    doc = new SecurityUser({});
  }
  if ("customer" in req.body){
    doc.customer = customer;
  }
  if ("contact" in req.body){
    doc.contact = contact;
  }

  if ("name" in req.body){
    doc.name = name;
  }

  if ("phone" in req.body){
    doc.phone = phone;
  }
  if ("multiFactorAuthentication" in req.body){
    doc.multiFactorAuthentication = multiFactorAuthentication;
  }

  if ("multiFactorAuthenticationCode" in req.body){
    doc.multiFactorAuthenticationCode = multiFactorAuthenticationCode;
  }
  if ("multiFactorAuthenticationExpireTime" in req.body){
    doc.multiFactorAuthenticationExpireTime = multiFactorAuthenticationExpireTime;
  }

  if ("password" in req.body) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      doc.password = hashedPassword;
    } catch (error) {
      logger.error(new Error(error));
      throw new Error(error);
    }
  }

  if ("login" in req.body){
    doc.login = login.toLowerCase().trim();
  }

  if ("email" in req.body){
    doc.email = email.toLowerCase().trim();
  }

  if ("currentEmployee" in req.body){
    doc.currentEmployee = currentEmployee;
  }

  if ("expireAt" in req.body){
    doc.expireAt = expireAt;
  }

  if ("roles" in req.body){
    doc.roles = roles;
  }

  if ("regions" in req.body){
    doc.regions = regions;
  }

  if ("customers" in req.body){
    doc.customers = customers;
  }

  if ("machines" in req.body){
    doc.machines = machines;
  }

  if ("isActive" in req.body){
    doc.isActive = isActive;
  }

  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }



  if (reqType == "new" && "loginUser" in req.body ){
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