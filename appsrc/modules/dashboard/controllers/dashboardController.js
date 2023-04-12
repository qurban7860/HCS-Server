const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer } = require('../../crm/models');
const { Machine } = require('../../machines/models');
const { SecurityUser } = require('../../security/models');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')


exports.getData = async (req, res, next) => {

  try{
    let customerCount = await Customer.find({isActive:true}).countDocuments();
    let machineCount = await Machine.find({isActive:true}).countDocuments();
    let userCount = await SecurityUser.find({isActive:true}).countDocuments();
    res.json({customerCount, machineCount, userCount});

  }catch(e) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }

};
