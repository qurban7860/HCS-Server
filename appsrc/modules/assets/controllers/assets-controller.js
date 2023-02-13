const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Assets } = require('../models');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let assetservice = require('../service/assetservice')
this.aserv = new assetservice();

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {}, this.query = {}, this.orderBy = { name: 1 }, this.populate = '';

exports.getAsset = async (req, res, next) => {
  this.aserv.getObjectById(Assets, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getAssets = async (req, res, next) => {
  this.aserv.getAssets(Assets, this.fields, this.query, this.orderBy, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteAsset = async (req, res, next) => {
  this.aserv.deleteObject(Assets, req.params.id, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { location, assetModel, name, notes, serial, status, assetTag } = req.body;
    const assetSchema = new Assets({
      name,
      status,
      assetTag,
      assetModel,
      serial,
      location,
      notes,
      createdAt: new Date(),
      image: req.file == undefined ? null : req.file.path,
    });

    this.aserv.postAsset(assetSchema, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ assets: response });
      }
    }
  }
};

exports.patchAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    req.body.image = req.file == undefined ? req.body.imagePath : req.file.path;

    this.aserv.patchAsset(Assets, req.params.id, req.body, callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};