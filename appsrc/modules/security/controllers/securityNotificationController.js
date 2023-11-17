const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const _ = require('lodash');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let securityDBService = require('../service/securityDBService')
this.dbservice = new securityDBService();

const { SecurityNotification } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
this.populate = [
  {path: '', select: ''}
];


this.populateList = [
  {path: '', select: ''}
];


exports.getSecurityNotification = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};

  this.dbservice.getObjectById(SecurityNotification, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.getSecurityNotifications = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};

  this.dbservice.getObjectList(SecurityNotification, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.postSecurityNotification = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    async function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
          );
      } else {
        let notification = await SecurityNotification.findById(response.id).populate('sender');
        const wss = getSocketConnectionByUserId(receiver);

        wss.map((ws)=> {  
          if(ws.userId==receiver) {
            ws.send(Buffer.from(JSON.stringify({'eventName' : 'newNotification', receiver, notification})));
            ws.terminate();
          }
        });
        res.status(StatusCodes.CREATED).json({ notification });
      }
    }
  }
};

exports.createNotification = async(message='', sender='', receiver='', type='system') => {

  if(sender && receiver && message) {
    let notification = await SecurityNotification.create({
      sender:sender,
      receivers:[receiver],
      type,
      message
    });

    notification = await SecurityNotification.findById(notification.id).populate('sender');
    const wss = getSocketConnectionByUserId(receiver);

    wss.map((ws)=> {  
      if(ws.userId==receiver) {
        ws.send(Buffer.from(JSON.stringify({'eventName' : 'newNotification', receiver, notification})));
        ws.terminate();
      }
    });

  }


}

async function getDocumentFromReq(req, reqType){
  const { sender, message, type, receivers, readBy } = req.body;

  let doc = {};
  
  if (reqType && reqType == "new"){
    doc = new SecurityNotification({});
  }
  if ("sender" in req.body){
    doc.sender = sender;
  }
  if ("message" in req.body){
    doc.message = message;
  }
  if ("type" in req.body){
    doc.type = type;
  }

  if ("receivers" in req.body){
    doc.receivers = receivers;
  }

  if ("readBy" in req.body){
    doc.readBy = readBy;
  }
  
  
  return doc;
}