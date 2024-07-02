const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const { fDateTime } = require('../../../../utils/formatTime');
let backupDBService = require('../service/backupDBService')
this.dbservice = new backupDBService();
const { Backup } = require('../models');
const { render } = require('template-file');
const awsService = require('../../../../appsrc/base/aws');
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.WS_REGION });
const s3 = new AWS.S3();
const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'countries', select: '' }
];

exports.getBackup = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(Backup, this.fields, req.params.id, this.populate);
    res.json(response);

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getBackups = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    const response = await this.dbservice.getObjectList(req, Backup, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


exports.deleteBackup = async (req, res, next) => {
  try {
    const result = await this.dbservice.deleteObject(Backup, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postBackup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (req.body.isDefault === 'true' || req.body.isDefault === true) {
        await Backup.updateMany({}, { $set: { isDefault: false } }, function (err, result) {
          if (err) console.error(err);
          else console.log(result);
        });
      }
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      if (res) {
        res.status(StatusCodes.CREATED).json({ Backup: response });
      } else {
        console.log({ Backup: response });
      }
    } catch (error) {
      logger.error(new Error(error));
      if (res)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      else {
        console.log(error._message);
      }
    }
  }
};

exports.patchBackup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (req.body.isDefault === 'true' || req.body.isDefault === true) {
        await Backup.updateMany({}, { $set: { isDefault: false } }, function (err, result) {
          if (err) console.error(err);
          else console.log(result);
        });
      }

      const result = await this.dbservice.patchObject(Backup, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

const dbCronTime = process.env.DB_CRON_TIME && process.env.DB_CRON_TIME.trim().length > 0 ? process.env.DB_CRON_TIME : null;
const dbS3Bucket = process.env.DB_BACKUP_S3_BUCKET && process.env.DB_BACKUP_S3_BUCKET.trim().length > 0 ? process.env.DB_BACKUP_S3_BUCKET : null;
const dbCronJob =  process.env.DB_CRON_JOB === 'true' || process.env.DB_CRON_JOB === true;

if (dbCronTime && dbCronJob && dbS3Bucket ) {
  cron.schedule(dbCronTime, async () => {
    try {
      await exports.dbBackup();
    } catch (error) {
      console.error('Error occurred while running DB backup:', error);
    }
  });
  console.log(`Cron job scheduled with configuration: ${dbCronTime}`);
} else {
  console.log('Cron job not scheduled. Either DB_CRON_JOB or DB_CRON_JOB parameter is missing or incorrect');
}


exports.sendEmailforBackup = async (req, res, next) => {

  const emailToSend = process.env.DB_BACKUP_NOTIFY_TO; 
  let emailSubject = "Database Backup";

  const {
    name,
    backupDuration,
    backupMethod,
    backupLocation,
    backupStatus,
    databaseVersion,
    databaseName,
    backupType,
    backupSize,
    backupTime,
  } = req.body;

  let params = {
    to: emailToSend,
    subject: emailSubject,
    html: true
  };

  let username = process.env.APP_NAME?.trim().length > 0 ? process.env.APP_NAME : 'Howick Cloud Services Backend'; 
  let hostName = process.env.ENV?.trim().length > 0 ? process.env.ENV : 'Howick Cloud Services'; 

  if (process.env.CLIENT_HOST_NAME)
    hostName = process.env.CLIENT_HOST_NAME;

  let hostUrl = "https://portal.howickltd.com";

  if (process.env.CLIENT_APP_URL)
    hostUrl = process.env.CLIENT_APP_URL;

  fs.readFile(__dirname + '/../../email/templates/footer.html', 'utf8', async function (err, data) {
    let footerContent = render(data, { hostName, hostUrl, username })

    fs.readFile(__dirname + '/../../email/templates/data-base-backup.html', 'utf8', async function (err, data) {

      let htmlData = render(data, { hostName, hostUrl, footerContent, name, databaseName, backupSize, backupTime, backupLocation })
      params.htmlData = htmlData;
      let response = await awsService.sendEmail(params);
    })
  });
};

exports.dbBackup = async (req, res, next) => {
  
  const startTime = performance.now();
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -5);
  const s3Bucket = process.env.DB_BACKUP_S3_BUCKET?.trim().length > 0 ? process.env.DB_BACKUP_S3_BUCKET : "db-backups";
  const backupNotifyTo = process.env.DB_BACKUP_NOTIFY_TO?.trim()?.length > 0
  const collectionToImport = process.env.DB_DB_BACKUP_COLLECTIONS?.trim().length > 0 ? `--collection ${process.env.DB_BACKUP_COLLECTIONS}` : ''; 
  const cmdToExecute = `mongodump --out ${s3Bucket} ${collectionToImport} --uri="mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_NAME}"`;
  exec(cmdToExecute,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`mongodump error: ${error.message}`);
        return false;
      }
      if (stderr) {
        console.error(`mongodump stderr: ${stderr}`);
      }

      const fileNameZip = `db-${timestamp}.zip`;
      const pathToZip = `./${fileNameZip}`;
      const output = fs.createWriteStream(pathToZip);
      const archive = archiver('zip');

      archive.on('error', (err) => {
        console.error(`Error zipping backup folder: ${err.message}`);
      });
      let totalZipSizeInBytes = 0;
      archive.on('data', (data) => {
        totalZipSizeInBytes += data.length;
      });
      const totalZipSizeInkb = totalZipSizeInBytes / 1024;
      archive.pipe(output);
      archive.directory(`${s3Bucket}/`, false);
      archive.finalize();

      output.on('close', () => {
        console.log('Backup folder has been zipped successfully');
        const S3Path = 'FRAMA-DB';
        console.log('SIZE: ',totalZipSizeInkb);
        if (totalZipSizeInkb > 0) {
          uploadToS3(pathToZip, fileNameZip, S3Path)
            .then(() => {
              fs.rm(s3Bucket, { recursive: true }, (err) => {
                if (err) {
                  console.error('Error removing directory:', err);
                  return;
                } else {
                  console.log('Directory removed successfully.');
                }
              });

              fs.rm(pathToZip, { recursive: true }, (err) => {
                if (err) {
                  console.error('Error removing directory:', err);
                  return;
                } else {
                  console.log('Directory removed successfully.');
                }
              });
              console.log('Upload completed.');
            })
            .catch((err) => {
              console.error('Upload failed:', err);
            });
          const endTime = performance.now();
          const endDateTime =  fDateTime(new Date());
          const durationSeconds = (endTime - startTime) / 1000;
          let req = {};
          req.body = {};
          const backupsizeInGb = totalZipSizeInkb > 0 ? totalZipSizeInkb / (1024 * 1024) : 0
          req.body = {
            name: fileNameZip,
            backupDuration: durationSeconds,
            backupMethod: 'mongodump',
            backupLocation: `${S3Path}/${fileNameZip}`,
            backupStatus: '201',
            databaseVersion: '1',
            databaseName: process.env.MONGODB_USERNAME,
            backupType: 'SYSTEM',
            backupSize: `${parseFloat(backupsizeInGb.toFixed(4))|| 0} GB`,
            backupTime: endDateTime
          };
          if( s3Bucket && backupNotifyTo )
            exports.sendEmailforBackup(req);
          else {
            console.error("ADMIN EMAIL for db backup is missing in .env");
          }
          exports.postBackup(req, res, next);
        } else {
          console.error("Db backup failed.");
        }
      });
    }
  );
}

async function uploadToS3(filePath, key, folderName) {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${folderName}/${key}`,
    Body: fileContent
  };
  try {
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. Location: ${data.Location}`);
    return data;
  } catch (err) {
    console.error('Error uploading file to S3:', err);
    throw err;
  }
}

function getDocumentFromReq(req, reqType) {
  const {
    name,
    backupSize,
    backupType,
    databaseName,
    databaseVersion,
    backupStatus,
    backupLocation,
    backupMethod,
    backupDuration, isActive, isArchived, loginUser
  } = req.body;


  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Backup({});
  }

  if ("name" in req.body) {
    doc.name = name;
  }

  if ("backupSize" in req.body) {
    doc.backupSize = backupSize;
  }

  if ("backupType" in req.body) {
    doc.backupType = backupType;
  }

  if ("databaseName" in req.body) {
    doc.databaseName = databaseName;
  }

  if ("databaseVersion" in req.body) {
    doc.databaseVersion = databaseVersion;
  }

  if ("backupStatus" in req.body) {
    doc.backupStatus = backupStatus;
  }

  if ("backupLocation" in req.body) {
    doc.backupLocation = backupLocation;
  }

  if ("backupMethod" in req.body) {
    doc.backupMethod = backupMethod;
  }

  if ("backupDuration" in req.body) {
    doc.backupDuration = backupDuration;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if (reqType == "new" && "loginUser" in req.body) {
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  }
  return doc;
}


exports.getDocumentFromReq = getDocumentFromReq;