const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const models = require('../models');

const HttpError = require('../../config/models/http-error');
let dbService = require('../../db/dbService')

let rtnMsg = require('../../config/static/static')
this.db = new dbService(models.Assets);



const  logger  = require('../../config/logger');

if(process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined) {
  this.debug = process.env.LOG_TO_CONSOLE;
} else {
  this.debug = false;
}

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };
this.populate = 'department_id';




/**
 * get Assets arraylist
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */

exports.getAsset = async (req, res, next) => {
  if(this.debug) console.log("getObjectById..");
  this.db.getObjectById(this.fields, req.params.id, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

/**
 * get Assets arraylist
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
exports.getAssets = async (req, res, next) => {

  // logger.info("message here", {meta: 1});
  // logger.warn("message");
  // logger.error("message");
  // logger.debug("getObjectList");

  this.db.getObjectList(this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

/**
 * delete asset function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
exports.deleteAsset = async (req, res, next) => {
  if(this.debug) console.log("deleteObject..");
  this.db.deleteObject(req.params.id, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

/**
 * add asset function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
exports.postAsset = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { department_id, location, assetModel, name, notes, serial, status, assetTag } = req.body;
    const assetSchema = new models.Assets({
      name,
      status,
      assetTag,
      assetModel,
      serial,
      location,
      department_id,
      notes,
      createdAt: new Date(),
      image: req.file == undefined ? null : req.file.path,
    });

    this.db.postObject(assetSchema, callbackFunc);
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

/**
 * update Asset function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
exports.patchAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    req.body.image = req.file == undefined ? req.body.imagePath : req.file.path;
    this.db.patchObject(req.params.id, req.body, callbackFunc);
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
