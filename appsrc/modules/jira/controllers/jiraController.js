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
this.params = { orderBy: '-name', id: 10026, name: "1.4.9" , released: false};

exports.getReleases = async (req, res, next) => {
  try {
    let config = {
      url: getURL("version"),
      method: 'get',
      params: this.params,
      ...getHeader(),
    };

    axios(config)
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getRelease = async (req, res, next) => {
  try {
    let config = {
      url: getURL("version"),
      method: 'get',
      params: this.orderBy,
      query: {id: "10026"},
      ...getHeader(),
    };

    axios(config)
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      });
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
      'Authorization': `Basic ${base64String}`
    },
    timeout: 10000,
  };
  return config;
}

function getURL(endpoint) {
  const jiraHost = process.env.JIRA_HOST;
  const jiraProject = process.env.JIRA_PROJECT;
  const versionUrl = `https://${jiraHost}${jiraProject}/${endpoint}`;
  return versionUrl;
}