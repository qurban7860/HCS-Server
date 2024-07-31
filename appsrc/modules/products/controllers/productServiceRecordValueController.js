const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')
const awsService = require('../../../../appsrc/base/aws');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductServiceRecords, ProductCheckItem, ProductServiceRecordValue, ProductServiceRecordValueFile } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

exports.getProductServiceRecordValue = async (req, res, next) => {
  this.dbservice.getObjectById(ProductServiceRecordValue, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }

};

exports.getProductServiceRecordValues = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { name: 1 };
  this.dbservice.getObjectList(req, ProductServiceRecordValue, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
}

exports.getProductServiceRecordCheckItems = async (req, res, next) => {

  let populateObject = [
    {path: 'serviceRecordConfig', select: 'docTitle recordType checkItemLists '},
    {path: 'createdBy', select: 'name'},
    {path: 'updatedBy', select: 'name'}
  ];
  try{
  this.dbservice.getObjectById(ProductServiceRecords, this.fields, req.params.serviceId, populateObject, callbackFunc);

  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      // fetching active values.
      let listProductServiceRecordValues = await ProductServiceRecordValue.find(
      { serviceId: response.serviceId, isHistory: false, isActive: true, isArchived: false }, 
      {checkItemValue: 1, comments: 1, serviceRecord: 1, serviceId:1, checkItemListId: 1, machineCheckItem: 1, createdBy: 1, createdAt: 1}
      ).populate([{path: 'createdBy', select: 'name'}, {path: 'serviceRecord', select: 'versionNo'}])
      .sort({createdAt: -1});
      listProductServiceRecordValues = JSON.parse(JSON.stringify(listProductServiceRecordValues));

      // fetching history values.
      let listProductServiceRecordHistoryValues = await ProductServiceRecordValue.find(
      { serviceId: response.serviceId, isHistory: true, isActive: true, isArchived: false },
      { serviceRecord:1, serviceId:1, checkItemListId:1, machineCheckItem:1, checkItemValue: 1, comments: 1, createdBy: 1, createdAt: 1 }
      ).populate([{path: 'createdBy', select: 'name'}, {path: 'updatedBy', select: 'name'}, {path: 'serviceRecord', select: 'versionNo'}])
      .sort({createdAt: -1});
      listProductServiceRecordHistoryValues = JSON.parse(JSON.stringify(listProductServiceRecordHistoryValues));
    
      if(response.serviceRecordConfig && 
        Array.isArray(response.serviceRecordConfig.checkItemLists) &&
        response.serviceRecordConfig.checkItemLists.length>0) {
        let index = 0;
        for(let checkParam of response.serviceRecordConfig.checkItemLists) {
          if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
            let indexP = 0;
            let productCheckItemObjects = await ProductCheckItem.find({_id:{$in:checkParam.checkItems}}).populate([{path: 'createdBy', select: 'name'},{path: 'updatedBy', select: 'name'}]);
            productCheckItemObjects = JSON.parse(JSON.stringify(productCheckItemObjects));
            for(let paramListId of checkParam.checkItems) { 
              let productCheckItemObject = productCheckItemObjects.find((PCIO)=>paramListId.toString()==PCIO._id.toString());
              if(!productCheckItemObject)
                continue;
              
              let PSRV = listProductServiceRecordValues.find((psrval)=>              
                psrval.machineCheckItem.toString() == paramListId && 
              psrval.checkItemListId.toString() == checkParam._id
            );

              let matchedHistoryVal = listProductServiceRecordHistoryValues.filter((psrval) => {
                return (
                  psrval.machineCheckItem.toString() === paramListId &&
                  psrval.checkItemListId.toString() === checkParam._id
                );
              });

              if(PSRV) {
                const checkItemFiles= await ProductServiceRecordValueFile.find(
                    { serviceId: PSRV?.serviceId, 
                      machineCheckItem: PSRV?.machineCheckItem, 
                      checkItemListId: PSRV?.checkItemListId, 
                      isActive: true, isArchived: false }
                    ).select('_id name extension fileType thumbnail path').lean()

                productCheckItemObject.recordValue = {
                  serviceRecord : PSRV.serviceRecord,
                  checkItemValue : PSRV.checkItemValue,
                  files: checkItemFiles,
                  comments : PSRV.comments,
                  createdBy : PSRV.createdBy,
                  createdAt : PSRV.createdAt
                }
              }
              if(matchedHistoryVal)
                productCheckItemObject.historicalData = matchedHistoryVal;

              response.serviceRecordConfig.checkItemLists[index].checkItems[indexP] = productCheckItemObject;
              indexP++;
            }
          }
          index++;
        }
      }
      res.json(response?.serviceRecordConfig);
    }
  }
} catch(e){
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
}
};

exports.deleteProductServiceRecordValue = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceRecordValue, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductServiceRecordValue = async (req, res, next) => {
  try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
      if(!req.body.loginUser){
        req.body.loginUser = await getToken(req);
      }
      req.body.machineId = req.params.machineId;

      this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
      async function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send( error._message );
        } else {
          const findQuery = { 
            serviceId: response?.serviceId, 
            machineCheckItem: response?.machineCheckItem, 
            checkItemListId: response?.checkItemListId, 
            isActive: true, 
            isArchived: false 
          }
          await ProductServiceRecordValue.updateMany( { ...findQuery,_id: { $nin: response?._id } }, { $set: { isHistory: true } } );
          response.machineId = req.params.machineId;
          const checkItemFiles= await ProductServiceRecordValueFile.find( findQuery ).select('_id name extension fileType thumbnail path').lean()
          const savedFiles = await handleServiceRecordValueFiles( response, req, res )

            const newResponse = { ...response?._doc, files: [...checkItemFiles, ...savedFiles ] }
          res.status(StatusCodes.CREATED).json( newResponse );
        }
      }
    }
  } catch (e) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchProductServiceRecordValue = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let alreadyExists = await ProductServiceRecordValue.findOne({name:req.body.name,_id:{$ne:req.params.id}});
    if(alreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Product Service Record with this name already Exists!');
    }

    if(!req.body.loginUser){
      req.body.loginUser = await getToken(req);
    }

    
    this.dbservice.patchObject(ProductServiceRecordValue, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      } else {
        await handleServiceRecordValueFiles(result, req, res )
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};

async function handleServiceRecordValueFiles(checkitem, req, res) {
  try {
    const machine = checkitem.machineId;
    const machineServiceRecord = checkitem.id;

    let files = [];
    if (req?.files?.images) {
      files = req.files.images;
    } else {
      return;
    }

    const fileProcessingPromises = files.map(async (file) => {
      if (!file || !file.originalname) {
        throw new Error('Invalid file');
      }

      const processedFile = await processFile(file, req.body.loginUser.userId);
      req.body.path = processedFile.s3FilePath;
      req.body.fileType = req.body.type = processedFile.type;
      req.body.extension = processedFile.fileExt;
      req.body.awsETag = processedFile.awsETag;
      req.body.eTag = processedFile.eTag;
      req.body.machine = machine;
      req.body.machineServiceRecord = machineServiceRecord;
      req.body.name = processedFile.name;

      if (processedFile.base64thumbNailData) {
        req.body.thumbnail = processedFile.base64thumbNailData;
        req.body.name = processedFile.name;
      }

      const serviceRecordCheckItemFileObject = await getServiceRecordValueFileFromReq(req, 'new');
      await serviceRecordCheckItemFileObject.save();
      return serviceRecordCheckItemFileObject;
    });

    const savedFiles = await Promise.all(fileProcessingPromises);
    return savedFiles;
  } catch (e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send( "Files save failed!");
  }
}

async function readFileAsBase64(filePath) {
  try {
    const fileData = await fs.promises.readFile(filePath);
    const base64Data = fileData.toString('base64');
    return base64Data;
  } catch (error) {
    console.log('Error reading file as base64:', error);
    throw error;
  }
}

async function generateThumbnail(filePath) {
  try {
    const thumbnailSize = 80;
    const thumbnailPath = getThumbnailPath(filePath);     
    await sharp(filePath)
      .resize(thumbnailSize, null)
      .toFile(thumbnailPath);

    return thumbnailPath;
    
  } catch (error) {
    console.log(error);
  }
}

function getThumbnailPath(filePath) {
  const thumbnailName = path.basename(filePath, path.extname(filePath)) + '_thumbnail.png';
  return path.join(process.env.UPLOAD_PATH, thumbnailName);
}

async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;

  let base64fileData = null;
  if(file.buffer)
    base64fileData = file.buffer;
  else 
    base64fileData = await readFileAsBase64(file.path);

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
  }
  else{
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

function getDocumentFromReq(req, reqType){
  const { serviceRecord, serviceId, machineCheckItem, checkItemListId, checkItemValue, comments, files , isHistory, isActive, isArchived, 
    loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceRecordValue({});
  }

  if ("serviceRecord" in req.body) {
    doc.serviceRecord = serviceRecord;
  }

  if ("serviceId" in req.body) {
    doc.serviceId = serviceId;
  }

  if ("machineCheckItem" in req.body) {
    doc.machineCheckItem = machineCheckItem;
  }
  
  if ("checkItemListId" in req.body) {
    doc.checkItemListId = checkItemListId;
  }
  
  if ("checkItemValue" in req.body) {
    doc.checkItemValue = checkItemValue;
  }
  
  if ("comments" in req.body) {
    doc.comments = comments;
  }

  if ("isHistory" in req.body){
    doc.isHistory = isHistory;
  }
  
  if ("isActive" in req.body){
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}


function getServiceRecordValueFileFromReq(req, reqType) {

  const { serviceRecord, serviceId, machineCheckItem, checkItemListId, path, extension, name, machine, fileType, awsETag, eTag, thumbnail, user, isActive, isArchived, loginUser } = req.body;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new ProductServiceRecordValueFile({});
  }

  if ("serviceRecord" in req.body) {
    doc.serviceRecord = serviceRecord;
  }

  if ("serviceId" in req.body) {
    doc.serviceId = serviceId;
  }

  if ("machineCheckItem" in req.body) {
    doc.machineCheckItem = machineCheckItem;
  }

  if ("checkItemListId" in req.body) {
    doc.checkItemListId = checkItemListId;
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

  if ("machine" in req.body) {
    doc.machine = machine;
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
