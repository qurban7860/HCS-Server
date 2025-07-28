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
  { path: 'senderInvitationUser', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'contact', select: 'firstName lastName' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];


exports.getUserInvitation = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id;
    const response = await this.dbservice.getObject(SecurityUserInvite, this.query, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
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
      const updateData = getDocumentFromReq(req);

      if (req.body.status === 'CANCELLED') {
        updateData.invitationStatus = 'REVOKED';
        updateData.statusUpdatedAt = new Date();
      }

      const result = await this.dbservice.patchObject(SecurityUserInvite, req.params.id, updateData);
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.postUserInvite = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (!req.body.email) req.body.email = req.body.login;
    if (!req.body.login) req.body.login = req.body.email;

    let queryString = {
      isArchived: false,
      $or: [
        { email: req.body.email?.toLowerCase()?.trim() },
        { login: req.body.login?.toLowerCase()?.trim() }
      ]
    };

    // Check both SecurityUser and pending invites
    const [existingUser, existingInvite] = await Promise.all([
      SecurityUser.findOne(queryString),
      SecurityUserInvite.findOne({
        ...queryString,
        invitationStatus: 'PENDING'
      })
    ]);

    if (existingUser || existingInvite) {
      return res.status(StatusCodes.CONFLICT).send(existingUser ? "Email/Login already exists!" : "An invitation is already pending for this email/login!");
    }

    const doc = await getDocumentFromReq(req, "new");
    const invitation = await this.dbservice.postObject(doc);

    req.params.id = invitation._id;
    await this.userEmailService.sendUserInviteEmail(req, res);

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("User invite failed!");
    throw error;
  }
}

exports.sendUserInvite = async (req, res, next) => {
  try {
    await this.userEmailService.sendUserInviteEmail(req, res);
  } catch (err) {
    logger.error(new Error(err));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Sending user invite failed!");
  }
}

exports.resendUserInvite = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const invitation = await SecurityUserInvite.findById(req.params.id);

    if (!invitation) {
      return res.status(StatusCodes.NOT_FOUND).send("Invitation not found!");
    }

    // only PENDING or EXPIRED invitations can be resent
    if (!['PENDING', 'EXPIRED'].includes(invitation.invitationStatus)) {
      return res.status(StatusCodes.BAD_REQUEST).send("Cannot resend invitation with current status!");
    }

    const newInviteCode = (Math.random() + 1).toString(36).substring(7);
    const inviteCodeExpireHours = parseInt(process.env.INVITE_EXPIRE_HOURS) || 48;
    const newExpireTime = new Date(Date.now() + inviteCodeExpireHours * 60 * 60 * 1000);

    // Update invitation with new code and expiry
    const updateData = {
      inviteCode: newInviteCode,
      inviteExpireTime: newExpireTime,
      invitationStatus: 'PENDING',
      statusUpdatedAt: new Date(),
      inviteSentCount: invitation.inviteSentCount + 1,
      lastInviteSentAt: new Date()
    };

    if (req.body.loginUser) {
      updateData.updatedBy = req.body.loginUser.userId;
      updateData.updatedIP = req.body.loginUser.userIP;
    }

    await this.dbservice.patchObject(SecurityUserInvite, req.params.id, updateData);

    // Send the new invitation email
    await this.userEmailService.sendUserInviteEmail(req, res);

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Resending user invite failed!");
  }
};


exports.verifyInviteCode = async (req, res, next) => {
  const invitation = await SecurityUserInvite.findOne({
    inviteCode: req.params.code,
    invitationStatus: 'PENDING',
    inviteExpireTime: { $gt: new Date() }
  })
    .populate('customer', 'name type')
    .populate('contact', 'firstName lastName')
    .populate('roles')
    .populate('regions')
    .populate('customers')
    .populate('machines');

  if (!invitation) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      valid: false,
      message: 'Invalid or expired invitation code'
    });
  }

  const invitedUserDetails = {
    customerName: invitation.customer?.name,
    customerType: invitation.customer?.type,
    contactName: invitation.contact ?
      `${invitation.contact.firstName} ${invitation.contact.lastName}` : '',
    contactId: invitation.contact?._id,
    fullName: invitation.name,
    email: invitation.email,
    phone: invitation.phone,
    login: invitation.login,
    roles: invitation.roles,
    regions: invitation.regions,
    customers: invitation.customers,
    machines: invitation.machines,
    dataAccessibilityLevel: invitation.dataAccessibilityLevel,
    currentEmployee: invitation.currentEmployee,
    invitationId: invitation._id
  }
  return res.status(StatusCodes.OK).json({ valid: true, ...invitedUserDetails });
};

exports.setInvitedUserPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const invitation = await SecurityUserInvite.findOne({
        _id: req.params.id,
        invitationStatus: 'PENDING',
        inviteExpireTime: { $gt: new Date() }
      });

      if (!invitation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid or expired invitation",
        });
      }

      // Create new SecurityUser from invitation data
      const newUser = new SecurityUser({
        customer: invitation.customer,
        contact: invitation.contact,
        name: req.body.fullName || invitation.name,
        email: invitation.email,
        login: invitation.login,
        phone: req.body.phone || invitation.phone,
        password: await bcrypt.hash(req.body.password, 12),
        roles: invitation.roles,
        regions: invitation.regions,
        customers: invitation.customers,
        machines: invitation.machines,
        dataAccessibilityLevel: invitation.dataAccessibilityLevel,
        currentEmployee: invitation.currentEmployee,
        whiteListIPs: invitation.whiteListIPs,
        isActive: true,
      });

      const savedUser = await newUser.save();

      if (!savedUser.contact) {
        const contact = await CustomerContact.create({
          customer: savedUser.customer,
          firstName: savedUser.name,
          phone: savedUser.phone,
          email: savedUser.email
        });

        savedUser.contact = contact[0]._id;
        await savedUser.save();
      }

      invitation.invitationStatus = "ACCEPTED";
      invitation.statusUpdatedAt = new Date();
      invitation.securityUser = savedUser._id;
      await invitation.save();

      res.status(StatusCodes.OK).json({
        message: "User account created successfully",
      });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error creating user account");
    }

    // if (ObjectId.isValid(req.params.id)) {
    //   let loginUser = await this.dbservice.getObjectById(SecurityUser, this.fields, req.params.id, this.populate);
    //   if(loginUser && req.body.password) {
    //     this.query = {receiverInvitationUser: req.params.id, invitationStatus: 'PENDING'};
    //     this.orderBy = {_id: -1};
    //     const securityUserInvite = await SecurityUserInvite.findOne(this.query).sort(this.orderBy);
    //     const currentTime = new Date();
    //     if(securityUserInvite && securityUserInvite.inviteExpireTime >= currentTime) {
    //       securityUserInvite.invitationStatus = 'ACCEPTED';
    //       await securityUserInvite.save();
    //       loginUser.password = await bcrypt.hash(req.body.password, 12);
    //       loginUser.name = req.body.fullName?req.body.fullName:'';
    //       loginUser.phone = req.body.phone?req.body.phone:'';
    //       loginUser.isActive = true;
    //       loginUser.invitationStatus = false;

    //       if(!loginUser.contact) {
    //         let contact = await CustomerContact.create({
    //           customer:loginUser.customer,
    //           firstName:loginUser.name,
    //           phone:loginUser.phone,
    //           email:loginUser.email
    //         });

    //         if(contact)
    //           loginUser.contact = contact.id;
    //       }
    //       await loginUser.save();
    //       res.status(StatusCodes.OK).json({ message: 'Information Updated Successfully' });
    //     } else {
    //       res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid Invitation!' });
    //     }
    //   }
    //   else {
    //     return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
    //   }
    // } else {
    //   return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
    // }
  }
};

function getDocumentFromReq(req, reqType) {
  const {
    isActive,
    isArchived,
    customer,
    customers,
    contact,
    name,
    phone,
    email,
    login,
    dataAccessibilityLevel,
    regions,
    machines,
    roles,
    loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new SecurityUserInvite({});

    doc.inviteCode = (Math.random() + 1).toString(36).substring(7);
    let inviteCodeExpireHours = parseInt(process.env.INVITE_EXPIRE_HOURS) || 48;
    doc.inviteExpireTime = new Date(Date.now() + inviteCodeExpireHours * 60 * 60 * 1000);
    doc.senderUser = req.body.loginUser.userId;
    doc.lastInviteSentAt = new Date();


    if ("loginUser" in req.body) {
      doc.senderInvitationUser = loginUser.userId;
    }

    if ("email" in req.body) {
      doc.email = email;
      doc.receiverInvitationEmail = email;
    }

    if ("customer" in req.body) doc.customer = customer;
    if ("contact" in req.body) doc.contact = contact;
    if ("name" in req.body) doc.name = name;
    if ("phone" in req.body) doc.phone = phone;
    if ("login" in req.body) doc.login = login;
    if ("roles" in req.body) doc.roles = roles;
    if ("dataAccessibilityLevel" in req.body) doc.dataAccessibilityLevel = dataAccessibilityLevel;
    if ("regions" in req.body) doc.regions = regions;
    if ("customers" in req.body) doc.customers = customers;
    if ("machines" in req.body) doc.machines = machines;
  }

  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body) {
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