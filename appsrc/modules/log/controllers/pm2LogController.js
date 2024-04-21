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

    if (!app) {
      return res.status(400).json({ error: 'Please provide the application name' });
    }

    // Connect to PM2
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

        if (!names.includes(app)) {
          pm2.disconnect(); // Disconnect from PM2
          return res.status(404).json({ error: `Process not found! Available processes: [${names}]` });
        }

        // Find the process you're interested in
        const targetProcess = processList.find(process => process.name === app);

        // Get log file paths
        let logPaths = [];
        if (out_log === 'true') {
          logPaths.push(targetProcess.pm2_env.pm_out_log_path);
        }
        if (err_log === 'true') {
          logPaths.push(targetProcess.pm2_env.pm_err_log_path);
        }

        // Read log files asynchronously
        const logs = [];

        logPaths.forEach(logPath => {
          const tail = new Tail(logPath);
          let lines = [];

          tail.on('line', (line) => {
            lines.push(line);
          });

          tail.on('error', (error) => {
            console.error('Error reading log file:', error);
          });

          tail.on('end', () => {
            // Calculate start and end index for pagination
            const startIndex = Math.max(lines.length - (page * linesPerPage), 0);
            const endIndex = Math.max(startIndex + parseInt(linesPerPage), 0);
            // Select lines for the current page
            logs.push(lines.slice(startIndex, endIndex).join('\n'));
            // Disconnect from PM2 when all logs are processed
            if (logs.length === logPaths.length) {
              pm2.disconnect();
              // Send logs as response
              res.json({ logs });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};