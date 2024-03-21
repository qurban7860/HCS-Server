const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const axios = require('axios');
const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let regionDBService = require('../service/jiraDBService')
this.dbservice = new regionDBService();

const { Country } = require('../../config/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { country_name: 1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'countries', select: '' }
];



exports.getVersions = async (req, res, next) => {
  const config = getHeader();
  config.url = `https://${process.env.JIRA_HOST}${process.env.JIRA_PROJECT}/version`,
    config.method = 'get';
  config.params = {
    orderBy: '-name'
  };

  console.log("config", config);

  axios(config)
    .then(response => {
      res.json(response.data);
    })
  try {


  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


function getHeader() {
  const tokenString = `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`;
  const base64String = Buffer.from(tokenString).toString('base64');
  const config = {
    headers: {
      'Authorization': `Basic ${base64String}`,
      'Cookie': 'atlassian.xsrf.token=657b7a25a1982ed9f117fabb874094bd9c282d48_lin'
    },
    timeout: 10000,
  };
  return config;
}