const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');
const { render } = require('template-file');
const fs = require('fs');
const awsService = require('../../../../appsrc/base/aws');
const { Config } = require('../../config/models');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const emailController = require('../../email/controllers/emailController');
const { ProductServiceRecords, ProductServiceRecordFiles , ProductServiceRecordValue, Product, ProductModel, ProductCheckItem } = require('../models');
const { CustomerContact } = require('../../crm/models');
const util = require('util');




exports.postServiceRecordFile = async (req, res, next) => {
    try{
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
      } else {
  
        if(!req.body.loginUser){
          req.body.loginUser = await getToken(req);
        }
  
        let file = {};
        if(req.files && req.files.images)
          file = req.files.images[0];
  
        if(!file || !file.originalname) {
          console.log('No File present for uploading')
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
  
        let name = req.body.name;
        let machine = req.params.machineId;
  
        const processedFile = await processFile(file, req.body.loginUser.userId);
        req.body.path = processedFile.s3FilePath;
        req.body.fileType =req.body.type = processedFile.type
        req.body.extension = processedFile.fileExt;
        req.body.awsETag = processedFile.awsETag;
        req.body.eTag = processedFile.eTag;
        req.body.machine = machine;
  
        if(processedFile.base64thumbNailData)
        req.body.content = processedFile.base64thumbNailData;
        req.body.originalname = processedFile.name;
  
        const serviveRecordFileObject = getDocumentFromReq(req, 'new');
        this.dbservice.postObject(serviveRecordFileObject, callbackFunc);
        function callbackFunc(error, response) {
          if (error) {
            logger.error(new Error(error));
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          } else {
            res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'File uploaded successfully!', false));
          }
        }
      }
    }catch(e) {
      console.log(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message:"Unable to save document"});
    }
  };
  
  exports.downloadServiceRecordFile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        try {
            const file = await dbservice.getObjectById( ProductServiceRecordFiles, this.fields, req.params.id);
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
                    console.log("fileSizeInMegabytes", fileSizeInMegabytes);
                    if (isImage && configObject && fileSizeInMegabytes > 2) {
                      console.log("OPTIMIZE_IMAGE_ON_DOWNLOAD STARTED ******** ");
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
            if(data.Body){
              return res.status(StatusCodes.ACCEPTED).send(data.Body);
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            }
        }
    }
  };
  
  
  exports.deleteServiceRecordFile = async (req, res, next) => {
    try {
      this.dbservice.deleteObject(ProductServiceRecordFiles, req.params.id, res, callbackFunc);
      function callbackFunc(error, result){
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      }
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  };
  


async function processFile(file, userId) {
    const { name, ext } = path.parse(file.originalname);
    const fileExt = ext.slice(1);
    let thumbnailPath;
    let base64thumbNailData;
    let base64fileData = null;
  
    if(file.buffer){
      base64fileData = file.buffer;
    } else {
      base64fileData = await readFileAsBase64(file.path);
    } 
  
    if(file.mimetype.includes('image')){
      thumbnailPath = await generateThumbnail(file.path);
      if(thumbnailPath)
        base64thumbNailData = await readFileAsBase64(thumbnailPath);
    }
    const fileName = userId+"-"+new Date().getTime();
    const s3Data = await awsService.uploadFileS3(fileName, 'uploads', base64fileData, fileExt);
    s3Data.eTag = await awsService.generateEtag(file.path);
    fs.unlinkSync(file.path);
    if(thumbnailPath){
      fs.unlinkSync(thumbnailPath);
    }
    if (!s3Data || s3Data === '') {
      throw new Error('AWS file saving failed');
    } else {
      return {
        fileName,
        name,
        fileExt,
        s3FilePath: s3Data.Key, 
        awsETag: s3Data.awsETag,
        eTag: s3Data.eTag,
        type: file.mimetype,
        physicalPath: file.path,
        base64thumbNailData
      };
    }
  }