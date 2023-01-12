const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const models = require('../models');
const HttpError = require('../../config/models/http-error');
let dbFunctions = require('../../db/dbFunctions')

let rtnMsg = require('../../config/static/static')



this.db = new dbFunctions(models.Assets);

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };



/**
 * get Assets arraylist
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */

exports.getAsset = async (req, res, next) => {
  this.db.getObjectById(this.fields, req.params.id, response);
  function response(error, responce) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(responce);
    }
  }
};

/**
 * get Assets arraylist
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
exports.getAssets = async (req, res, next) => {
  this.db.getList(this.fields, this.query, this.orderBy, response);
  function response(error, responce) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(responce);
    }
  }
};

/**
 * delete asset function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
exports.deleteAsset = async (req, res, next) => {
  this.db.deleteObject(req.params.id, response);
  function response(error, result) {
    if (error) {
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
 * @returns {json} - return json responce at client
 */
exports.postAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { department, location, assetModel, name, notes, serial, status, assetTag } = req.body;
    const assetSchema = new models.Assets({
      name,
      status,
      assetTag,
      assetModel,
      serial,
      location,
      department,
      notes,
      image: req.file == undefined ? null : req.file.path,
    });

    this.db.postObject(assetSchema, response);
    function response(error, responce) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ assets: responce });
      }
    }
  }
};

/**
 * update Asset function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
exports.putAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    req.body.image = req.file == undefined ? req.body.imagePath : req.file.path;
    this.db.putObject(req.params.id, req.body, response);
    function response(error, result) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};
