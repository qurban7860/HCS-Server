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
const { Config } = require('../../config/models');
const { renderEmail } = require('../../email/utils');
const path = require('path');
const { SecurityUser, SecurityUserInvite } = require('../models');
const { Customer, CustomerContact } = require('../../crm/models');
const { Product } = require('../../products/models');
const ObjectId = require('mongoose').Types.ObjectId;
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();
const emailService = require('../service/userEmailService');
const userEmailService = this.userEmailService = new emailService();


this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'senderInvitationUser', select: 'name'},
  {path: 'receiverInvitationUser', select: 'name'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];


  exports.getUserInvitation = async (req, res, next) => {
    this.dbservice.getObjectById(SecurityUserInvite, this.fields, req.params.id, this.populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json(response);
      }
    }
  };

  exports.getUserInvitations = async (req, res, next) => {
    this.query = req.query != "undefined" ? req.query : {};  
    this.dbservice.getObjectList(req, SecurityUserInvite, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json(response);
      }
    }
  };


  exports.patchUserInvitation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
      try {
        const result = await this.dbservice.patchObject(SecurityUserInvite, req.params.id, getDocumentFromReq(req));
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      } catch (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      }
    }
  };

  exports.sendUserInvite = async (req, res, next) =>{
    try{
      await this.userEmailService.sendUserInviteEmail(req, res );
    } catch(err){
      logger.error(new Error(err));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Sending user invite failed!");
    }
  }
  
  exports.verifyInviteCode = async (req, res, next) => {
    let securityUserInvite = await SecurityUserInvite.findOne({ 
      receiverInvitationUser : req.params.id, 
      inviteCode : req.params.code, 
      invitationStatus:"PENDING" 
    });
    if(!securityUserInvite) {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'Invalid invitation code'));
    }
    else {
      let user = await SecurityUser.findById(req.params.id)
      .populate('customer')
      .populate('contact');
      let customerName = '';
      let contactName = '';
      let contactId = '';
      
      if(user && user.customer && user.customer.name) {
        customerName = user.customer.name;
      }
      

      if(user && user.contact && user.contact.firstName) {
        contactName = user.contact.firstName +' '+ user.contact.lastName;
        contactId = user.contact.id;
      }

      return res.status(StatusCodes.OK).json({ 
        valid:true, 
        customerName,
        contactName,
        contactId,
        fullName:user.name,
        email:user.email,
        phone:user.phone,
        login:user.login,
        roles:user.roles
      });
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
        if(loginUser && req.body.password) {   
          this.query = {receiverInvitationUser: req.params.id, invitationStatus: 'PENDING'};
          this.orderBy = {_id: -1};
          const securityUserInvite = await SecurityUserInvite.findOne(this.query).sort(this.orderBy);
          const currentTime = new Date();
          if(securityUserInvite && securityUserInvite.inviteExpireTime >= currentTime) {
            securityUserInvite.invitationStatus = 'ACCEPTED';
            await securityUserInvite.save();
            loginUser.password = await bcrypt.hash(req.body.password, 12);
            loginUser.name = req.body.fullName?req.body.fullName:'';
            loginUser.phone = req.body.phone?req.body.phone:'';
            
            loginUser.invitationStatus = false;            

            if(!loginUser.contact) {
              let contact = await CustomerContact.create({
                customer:loginUser.customer,
                firstName:loginUser.name,
                phone:loginUser.phone,
                email:loginUser.email
              });
              
              if(contact)
                loginUser.contact = contact.id;
            }
            await loginUser.save();
            res.status(StatusCodes.OK).json({ message: 'Information Updated Successfully' });
          } else {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid Invitation!' });
          }
        }
        else {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));   
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
      }
    }
  }

  function getDocumentFromReq(req, reqType){
    const {senderInvitationUser, receiverInvitationUser, receiverInvitationEmail, inviteCode, inviteExpireTime, invitationStatus, isActive, isArchived, loginUser} = req.body;

    let doc = {};
    if (reqType && reqType == "new"){
      doc = new SecurityUserInvite({});


      if ("senderInvitationUser" in req.body){
        doc.senderInvitationUser = senderInvitationUser;
      }
  
      if ("receiverInvitationUser" in req.body){
        doc.receiverInvitationUser = receiverInvitationUser;
      }
  
      if ("receiverInvitationEmail" in req.body){
        doc.receiverInvitationEmail = receiverInvitationEmail;
      }
  
      if ("inviteCode" in req.body){
        doc.inviteCode = inviteCode;
      }
      if ("inviteExpireTime" in req.body){
        doc.inviteExpireTime = inviteExpireTime;
      }
    }


    if ("invitationStatus" in req.body){
      doc.invitationStatus = invitationStatus;
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