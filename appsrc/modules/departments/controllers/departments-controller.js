const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const models = require('../models');
const HttpError = require('../../config/models/http-error');
const { Departments } = require('../models');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let deptservice = require('../service/department-service')
this.deptserv = new deptservice();

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };



/**
 * get Department object
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */

exports.getDepartment = async (req, res, next) => {
  this.deptserv.getObjectById(Departments, this.fields, req.params.id, response);
  function response(error, response) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

/**
 * get Departments arraylist
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
exports.getDepartments = async (req, res, next) => {
  this.deptserv.getDepartments(Departments, this.fields, this.query, this.orderBy, response);
  function response(error, response) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

/**
 * delete department function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
 exports.deleteDepartment = async (req, res, next) => {
  if(this.debug) console.log("deleteObject..");
  this.deptserv.deleteObject(req.params.id, callbackFunc);
  function callbackFunc(error, result) {
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
 * @returns {json} - return json response at client
 */
exports.postDepartment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    console.log(req.body);
    const { name } = req.body;
    const departmentSchema = new models.Departments({
      name,
      createdAt: new Date()
    });

    this.deptserv.postObject(departmentSchema, response);
    function response(error, response) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ department: response });
      }
    }
  }
};

/**
 * update department function
 * @param {request} req - Request
 * @param {response} res - Response
 * @param {next} next - Next method to call
 * @returns {json} - return json response at client
 */
exports.patchDepartment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.deptserv.patchObject(req.params.id, req.body, response);
    function response(error, result) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};