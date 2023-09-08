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

const { SecurityUser, SecurityUserInvite } = require('../models');
const { Customer } = require('../../crm/models');
const { Product } = require('../../products/models');

const ObjectId = require('mongoose').Types.ObjectId;
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: 'senderInvitationUser', select: 'name'},
  {path: 'receiverInvitationUser', select: 'name'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

this.populateList = [
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
    this.dbservice.getObjectList(SecurityUserInvite, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json(response);
      }
    }
  };

  exports.postUserInvitation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
      let inviteData = getDocumentFromReq(req, 'new');
      await inviteData.save();
      this.dbservice.postObject(inviteData, callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
            //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
            );
        } else {
          res.status(StatusCodes.CREATED).json({ CustomerSite: response });
        }
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
    let user = await SecurityUser.findById(req.params.id);

    let userInvite = new SecurityUserInvite({});
    userInvite.senderInvitationUser = req.body.loginUser.userId;
    userInvite.receiverInvitationUser = req.params.id;
    userInvite.receiverInvitationEmail = user.email;
    userInvite.inviteCode = (Math.random() + 1).toString(36).substring(7);
    userInvite.inviteExpireTime = new Date().setHours(new Date().getHours() + 1);
    userInvite.invitationStatus = 'PENDING';
    await userInvite.save();
  
    let emailSubject = "User Invite - HOWICK";
  
    let emailContent = `Dear ${user.name},<br><br>Howick has invited you join howick cloud.Please click on below link and enter password for joining.<br><br>`;
  
    emailContent+=`${process.env.CLIENT_APP_URL}/invite/${req.params.id}/${user.inviteCode}/${userInvite.inviteExpireTime}`;
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
    let securityUserInvite = await SecurityUserInvite.findOne({ receiverInvitationUser : req.params.id, inviteCode : req.params.code });
    if(!securityUserInvite) {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'Invalid invitation code'));
    }
    else {
      return res.status(StatusCodes.OK).json({ valid:true });
    }
  };

  function getDocumentFromReq(req, reqType){
    const { senderInvitationUser, receiverInvitationUser, receiverInvitationEmail, inviteCode, inviteExpireTime, invitationStatus} = req.body;

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