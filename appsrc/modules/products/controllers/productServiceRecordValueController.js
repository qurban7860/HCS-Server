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

exports.getProductServiceRecordCheckItems = async (req, res) => {
  let populateObject = [
    { path: 'serviceRecordConfig', select: 'docTitle recordType checkItemLists' },
    { path: 'createdBy', select: 'name' },
    { path: 'updatedBy', select: 'name' }
  ];

  try {
    const response =  await ProductServiceRecords.findById( req.params.serviceId  ).populate( populateObject ).sort({ _id: -1 });
    const activeValues = await fetchServiceRecordValues(response.serviceId, false);
    const historicalValues = await fetchServiceRecordValues(response.serviceId, true);

    const responseData = JSON.parse(JSON.stringify(response?.serviceRecordConfig));

    if (response?.serviceRecordConfig && Array.isArray(response?.serviceRecordConfig?.checkItemLists)) {
      for (const [index, checkParam] of response.serviceRecordConfig.checkItemLists.entries()) {
        if (Array.isArray(checkParam?.checkItems)) {
          const checkItems = await fetchCheckItems(checkParam.checkItems);
          for (let checkItem of checkItems) {
            await updateCheckItemWithValues( checkItem, checkParam._id, activeValues, historicalValues, response );
          }
          responseData.checkItemLists[index].checkItems = checkItems
        }
      }
    }
    res.json(responseData);
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

async function fetchServiceRecordValues(serviceId, isHistory) {
  try{
    const productServiceRecordValues = await  ProductServiceRecordValue.find(
      { serviceId, isHistory, isActive: true, isArchived: false },
      { checkItemValue: 1, comments: 1, serviceRecord: 1, serviceId: 1, checkItemListId: 1, machineCheckItem: 1, createdBy: 1, createdAt: 1 }
    ).populate([{ path: 'createdBy', select: 'name' }, { path: 'serviceRecord', select: 'versionNo status' }])
    .sort({ createdAt: -1 })
    .lean();
    return productServiceRecordValues
  } catch (e) {
    logger.error(e);
    throw e;
  }
}


async function fetchCheckItems(checkItemIds) {
  try{ 
    const productCheckItems = await ProductCheckItem.find({ _id: { $in: checkItemIds } })
    .populate([{ path: 'createdBy', select: 'name' }, { path: 'updatedBy', select: 'name' }])
    .lean();
    return productCheckItems 
  } catch(e){
    logger.error(e);
    throw e;
  }
}
async function updateCheckItemWithValues( item, checkItemListId, activeValues, historicalValues, record ) {
  try {

    const isDraft = record?.status?.toLowerCase() === 'draft';
    const isHistoryRecord = record?.isHistory;
    let draftValue = null;
    let activeValue = null;
    let historyRecordValue = null;
    if( isDraft ){
      draftValue = activeValues.find(val =>
        val?.machineCheckItem?.toString() === item._id.toString() &&
        val?.checkItemListId?.toString() === checkItemListId.toString() && 
        val?.serviceRecord?._id?.toString() === record?._id?.toString()
      );
    }
    
    if( isHistoryRecord ){
      historyRecordValue = historicalValues.find(val =>
        val?.machineCheckItem?.toString() === item._id.toString() &&
        val?.checkItemListId?.toString() === checkItemListId.toString() && 
        val?.serviceRecord?._id?.toString() === record?._id?.toString()
      );
    } else {
      activeValue = activeValues.find(val =>
        val?.machineCheckItem?.toString() === item._id.toString() &&
        val?.checkItemListId?.toString() === checkItemListId.toString() && 
        val?.serviceRecord?.status?.toLowerCase() !== 'draft'
      );
    }

    const checkItemFiles = await fetchCheckItemFiles(record?._id, item._id, checkItemListId);

    // if (Array.isArray(checkItemFiles) && checkItemFiles.length > 0) {
      item.recordValue = { files: checkItemFiles };
    // }

    const historicalData = await Promise.all(
      historicalValues
        .filter(val =>
          val.machineCheckItem.toString() === item._id.toString() &&
          val.checkItemListId.toString() === checkItemListId.toString() &&
          val?.serviceRecord?.status?.toLowerCase() !== 'draft'
        )
        .map(async (val) => ({
          ...val,
          files: await fetchCheckItemFiles(val.serviceRecord?._id, val?.machineCheckItem, val?.checkItemListId),
        }))
    );

      if (isDraft && draftValue ) {
        item.recordValue = {
          ...item?.recordValue,
          _id: draftValue._id,
          serviceRecord: draftValue.serviceRecord,
          checkItemValue: draftValue.checkItemValue,
          comments: draftValue.comments,
          createdBy: draftValue.createdBy,
          createdAt: draftValue.createdAt,
        };
      } else if ( isHistoryRecord && historyRecordValue ){
        item.recordValue = {
          ...item?.recordValue,
          _id: historyRecordValue._id,
          serviceRecord: historyRecordValue.serviceRecord,
          checkItemValue: historyRecordValue.checkItemValue,
          comments: historyRecordValue.comments,
          createdBy: historyRecordValue.createdBy,
          createdAt: historyRecordValue.createdAt,
        };
      } else if ( !isDraft && !isHistoryRecord && activeValue ){
        item.recordValue = {
          ...item?.recordValue,
          _id: activeValue._id,
          serviceRecord: activeValue.serviceRecord,
          checkItemValue: activeValue.checkItemValue,
          comments: activeValue.comments,
          createdBy: activeValue.createdBy,
          createdAt: activeValue.createdAt,
        };
      }

      if ( isDraft && activeValue ) {
        const activeFiles = await fetchCheckItemFiles(
          activeValue.serviceRecord?._id,
          activeValue?.machineCheckItem,
          activeValue?.checkItemListId
        );
        item.historicalData = [{
          _id: activeValue._id,
          files: activeFiles,
          serviceRecord: activeValue.serviceRecord,
          machineCheckItem: activeValue?.machineCheckItem, 
          checkItemListId: activeValue?.checkItemListId,
          checkItemValue: activeValue.checkItemValue,
          comments: activeValue.comments,
          createdBy: activeValue.createdBy,
          createdAt: activeValue.createdAt,
        }, ...historicalData];
      } else if ( historicalData.length > 0 && !isHistoryRecord ) {
        item.historicalData = historicalData;
      }

    return item;

  } catch (e) {
    logger.error(e);
    throw e;
  }
}

async function fetchCheckItemFiles(serviceRecord, machineCheckItem, checkItemListId) {
  try{
    const productServiceRecordValueFiles = await ProductServiceRecordValueFile.find(
      { serviceRecord, machineCheckItem, checkItemListId, isActive: true, isArchived: false }
    ).select('_id serviceRecord name extension fileType thumbnail path').lean();
    return productServiceRecordValueFiles
  } catch(e){
    logger.error(e);
    throw e;
  }
}

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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (!req.body.loginUser) {
      req.body.loginUser = await getToken(req);
    }
    req.body.machineId = req.params.machineId;

    // Check if the record already exists
    const existingRecord = await ProductServiceRecordValue.findOne({
      serviceRecord: req.body.serviceRecord,
      machineCheckItem: req.body.machineCheckItem,
      checkItemListId: req.body.checkItemListId
    });

    if (existingRecord) {
      // If it exists, patch the existing record
      req.params.id = existingRecord._id; // Set the ID to the existing record's ID
      return await exports.patchProductServiceRecordValue(req, res, next);
    } else {
      // If it doesn't exist, create a new record
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      const findQuery = {
        serviceId: response?.serviceId,
        machineCheckItem: response?.machineCheckItem,
        checkItemListId: response?.checkItemListId,
        isActive: true,
        isArchived: false
      };
      response.machineId = req.params.machineId;

      const checkItemFiles = await ProductServiceRecordValueFile.find(findQuery)
        .select('_id name extension fileType thumbnail path')
        .lean();

      let newResponse = { ...response?._doc, files: [] };

      if (Array.isArray(checkItemFiles) && checkItemFiles.length > 0) {
        newResponse.files.push(...checkItemFiles);
      }

      const savedFiles = await handleServiceRecordValueFiles(response, req, res);
      if (savedFiles?.length) {
        newResponse.files.push(...savedFiles);
      }

      return res.status(StatusCodes.CREATED).json(newResponse);
    }
  } catch (e) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchProductServiceRecordValue = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    if(!req.body.loginUser){
      req.body.loginUser = await getToken(req);
    }
    const findQuery = { 
      serviceId: req.params?.serviceId, 
      machineCheckItem: req.params?.machineCheckItem, 
      checkItemListId: req.params?.checkItemListId, 
      isActive: true, 
      isArchived: false 
    }
    this.dbservice.patchObject(ProductServiceRecordValue, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      } else {
        const response = await ProductServiceRecordValue.findById( req.params.id ); 
        const checkItemFiles= await ProductServiceRecordValueFile.find( findQuery ).select('_id name extension fileType thumbnail path').lean()
        let newResponse = { ...response?._doc, files: [] };

        if (Array.isArray(checkItemFiles) && checkItemFiles.length > 0) {
          newResponse.files.push(...checkItemFiles);
        }
        
        const savedFiles = await handleServiceRecordValueFiles(response, req, res);
        if (savedFiles?.length) {
          newResponse.files.push(...savedFiles);
        }
        res.status(StatusCodes.ACCEPTED).json( newResponse );
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
      return false;
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
