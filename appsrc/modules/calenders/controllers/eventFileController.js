const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');
const awsService = require('../../../base/aws');
const { Config } = require('../../config/models');
const { processFile } = require('../../../../utils/fileProcess');
let calenderDBService = require('../service/calenderDBService')
this.dbservice = new calenderDBService();
const { Event, EventFile } = require('../models');


exports.getEventFiles = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : { event: req.params.eventId, isArchived: false, isActive: true };  
  if(!mongoose.Types.ObjectId.isValid(req.params.machineId))
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Event ID"});
  this.dbservice.getObjectList(req, EventFile, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};


exports.postEventFiles = async (req, res, next) => {
  try{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {

      if(!req.body.loginUser){
        req.body.loginUser = await getToken(req);
      }

      const event = await Event.findById(req.params.eventId);
      if(!event?._id){
        return res.status(StatusCodes.BAD_REQUEST).send("Invalid Event!");
      }

      let files = [];
      if(req?.files?.images){
        files = req.files.images;
      } else {
        return res.status(StatusCodes.OK).send('No file available to be uploaded!');
      }
 
      const fileProcessingPromises = files.map(async (file) => {
        if (!file || !file.originalname) {
          throw new Error('Invalid file');
        }
  
        const processedFile = await processFile(file, req.body.loginUser.userId);
        req.body.event = req.params.eventId;
        req.body.path = processedFile.s3FilePath;
        req.body.fileType = req.body.type = processedFile.type;
        req.body.extension = processedFile.fileExt;
        req.body.awsETag = processedFile.awsETag;
        req.body.eTag = processedFile.eTag;
        req.body.name = processedFile.name;
        if (processedFile.base64thumbNailData) {
          req.body.thumbnail = processedFile.base64thumbNailData;
          req.body.name = processedFile.name;
        }
  
        const eventFileObject = getEventFileFromReq(req, 'new');
        return this.dbservice.postObject(eventFileObject);
      });
  
      await Promise.all(fileProcessingPromises);
  
      next();
      // return res.status(StatusCodes.OK).send('Files uploaded successfully!');
    }
  }catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Files save failed!");
  }
};

exports.downloadEventFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      console.log(errors)
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
      try {
          const file = await EventFile.findOne({_id: req.params.id}).select('path');
          if (file) {
              if (file.path && file.path !== '') {
                  const data = await awsService.fetchAWSFileInfo(file._id, file.path);
                  
                  const allowedMimeTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp',
                    'image/tiff',
                    'image/gif',
                    'image/svg'
                  ];
                
                  const isImage = file?.fileType && allowedMimeTypes.includes(file.fileType);
                  const regex = new RegExp("^OPTIMIZE_IMAGE_ON_DOWNLOAD$", "i"); 
                  let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
                  const fileSizeInMegabytes = ((data.ContentLength / 1024) / 1024);
                  if (isImage && configObject && fileSizeInMegabytes > 2) {
                    const fileBase64 = await awsService.processAWSFile(data);
                    return res.status(StatusCodes.ACCEPTED).send(fileBase64);
                  } else {
                    return res.status(StatusCodes.ACCEPTED).send(data.Body);                    
                  }
              } else {
                  res.status(StatusCodes.NOT_FOUND).send(rtnMsg.recordCustomMessageJSON(StatusCodes.NOT_FOUND, 'Invalid file path', true));
              }
          } else {
              res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'File not found', true));
          }
      } catch (err) {
        console.log(err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
  }
};


exports.deleteEventFile = async (req, res, next) => {
  try {
    await this.dbservice.patchObject(EventFile, req.params.id, getEventFileFromReq(req), callbackFunc);
    function callbackFunc(error, result){
      if (error) {
        console.log(error);
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send('Event file Deleted Successfully!');
      }
    }
    res.status(StatusCodes.OK).send('Event file Deleted Successfully!');
  } catch (error) {
    logger.error(new Error(error));
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

async function getToken(req){
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:'';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

const getEventFileFromReq = (req, reqType) => {

  const { event, path, extension, name, fileType, awsETag, eTag, thumbnail, user, isActive, isArchived, loginUser } = req.body;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new EventFile({});
  }

  if ("event" in req.body) {
    doc.event = event;
  }

  if ("name" in req.body) {
    doc.name = name;
  }

  if ("path" in req.body) {
    doc.path = path;
  }

  if ("extension" in req.body) {
    doc.extension = extension;
  }

  if ("thumbnail" in req.body) {
    doc.thumbnail = thumbnail;
  }

  if ("fileType" in req.body) {
    doc.fileType = fileType;
  }

  if ("awsETag" in req.body) {
    doc.awsETag = awsETag;
  }

  if ("eTag" in req.body) {
    doc.eTag = eTag;
  }
  
  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }

  if ("user" in req.body) {
    doc.user = user;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
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

exports.getEventFileFromReq = getEventFileFromReq;