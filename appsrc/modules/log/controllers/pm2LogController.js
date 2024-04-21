const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const pm2 = require('pm2');
const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const fs = require('fs');
let logDBService = require('../service/logDBService')
this.dbservice = new logDBService();
const { LogFormat } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;



exports.getPM2Logs = async (req, res, next) => {
  try {
    const { app, out_log, err_log, page, linesPerPage } = req.query;
    pm2.connect((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to connect to PM2' });
      }

      // Get list of running processes
      pm2.list((err, processList) => {
        if (err) {
          console.error(err);
          pm2.disconnect(); // Disconnect from PM2
          return res.status(500).json({ error: 'Failed to get process list from PM2' });
        }
        const names = processList.map(item => item.name);
        if (!req.query.app) {
          return res.status(500).json({ error: `Please select from applications:[${names}]` });
        }



        // Find the process you're interested in
        const targetProcess = processList.find(process => process.name === req.query.app);

        if (!targetProcess) {
          pm2.disconnect(); // Disconnect from PM2
          return res.status(404).json({ error: `Process not found! Please select from: [${names}]` });
        }

        // Get log file paths
        let logPaths = [];
        if (req.query.out_log === 'true' || req.query.err_log === 'true') {
          if (req.query.out_log === 'true') {
            logPaths.push(targetProcess.pm2_env.pm_out_log_path);
          }
          if (req.query.err_log === 'true') {
            logPaths.push(targetProcess.pm2_env.pm_err_log_path);
          }
        } else {
          logPaths = [targetProcess.pm2_env.pm_out_log_path, targetProcess.pm2_env.pm_err_log_path];
        }

        // Read log files asynchronously
        const logs = logPaths.map(logPath => {
          const content = fs.readFileSync(logPath, 'utf8');
          // Split content by lines
          const lines = content.split('\n');
          // Calculate start and end index for pagination
          const startIndex = (page - 1) * linesPerPage;
          const endIndex = startIndex + parseInt(linesPerPage);
          // Select lines for the current page
          return lines.slice(startIndex, endIndex).join('\n');
        });


        pm2.disconnect(); // Disconnect from PM2
        // Send logs as response
        res.json({ logs });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};