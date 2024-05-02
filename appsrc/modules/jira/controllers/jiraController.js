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
this.params = { query: { name: "0.0.1" } };

exports.getReleases = async (req, res, next) => {
  try {
    const jiraProject = process.env.JIRA_PROJECT;


    let config = {
      url: getURL("project/HPS/version"),
      method: 'get',
      params: { orderBy: '-name' },
      ...getHeader(),
    };


    if (req?.query?.query) {
      config.params.query = req.query.query;
    }
    if (req?.query?.orderBy) {
      config.params.orderBy = req.query.orderBy;
    }

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
      url: getURL(`version/${req.params.id}`),
      method: 'get',
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

exports.getTickets = async (req, res, next) => {
  try {
    let jiraProject =  'HWKSC';
    if (req?.query?.project) {
      jiraProject = req?.query?.project;
    }

    const URL = getURL("search");
    let HEADER = '';
    if(jiraProject === 'HWKSC') {
      HEADER = await getHWKSCHeader();
    } else {
      HEADER = await getHeader();
    }

    let JQL = `project = ${jiraProject}`;

    if(req?.query?.serialNo?.trim().length > 0){
      JQL += ` AND "Serial No[Short text]" ~ "${req?.query?.serialNo}"`;
    }


    if(req?.query?.ref?.trim().length > 0){
      JQL += ` AND Organizations = "${req.query.ref}" `;
    }

    console.log({JQL});

    
    let config = {
      url: URL,
      method: 'get',
      params: {
        jql: JQL,
        orderBy: '-created',
        startAt:0,
        maxResults:10
      },
      ...HEADER,
    };

    

    if (req?.query?.query) {
      config.params.query = req.query.query;
    }

    if (req?.query?.orderBy) {
      config.params.orderBy = req.query.orderBy;
    }

    if (req?.query?.startAt) {
      config.params.startAt = req.query.startAt;
    }

    if (req?.query?.maxResults) {
      config.params.maxResults = req.query.maxResults;
    }

    axios(config)
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Validation failed!");
      });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


function getHeader() {
  const tokenString = `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`;
  const base64String = Buffer.from(tokenString).toString('base64');
  const config = {
    headers: {
      'Authorization': `Basic ${base64String}`, "Accept-Encoding": "gzip,deflate,compress"
    },
    timeout: 10000,
  };
  return config;
}

async function getHWKSCHeader() {
  const tokenString = `${process.env.JIRA_HWKSC_USERNAME}:${process.env.JIRA_HWKSC_API_TOKEN}`;
  const base64String = Buffer.from(tokenString).toString('base64');
  const config = {
    headers: {
      'Authorization': `Basic ${base64String}`, "Accept-Encoding": "gzip,deflate,compress"
    },
    timeout: 10000,
  };
  return config;
}

function getURL(endpoint) {
  const jiraHost = process.env.JIRA_HOST;
  const versionUrl = `https://${jiraHost}/${endpoint}`;
  return versionUrl;
}