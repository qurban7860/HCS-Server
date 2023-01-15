const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const models = require('../models');
const HttpError = require('../../config/models/http-error');
let dbFunctions = require('../../db/dbFunctions')

let rtnMsg = require('../../config/static/static')



this.db = new dbFunctions(models.Department);

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };



/**
 * get Department object
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */

exports.getDepartment = async (req, res, next) => {
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
 * get Departments arraylist
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
exports.getDepartments = async (req, res, next) => {
  this.db.getObjectList(this.fields, this.query, this.orderBy, response);
  function response(error, responce) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(responce);
    }
  }
};

/**
 * delete department function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
exports.deleteDepartments = async (req, res, next) => {
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
 * add department function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
exports.postDepartment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    console.log(req.body);
    const { name } = req.body;
    const departmentSchema = new models.Department({
      name,
      createdAt: new Date()
    });

    this.db.postObject(departmentSchema, response);
    function response(error, responce) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ department: responce });
      }
    }
  }
};

/**
 * update department function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json responce at client
 */
 exports.patchDepartment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.db.patchObject(req.params.id, req.body, response);
    function response(error, result) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};