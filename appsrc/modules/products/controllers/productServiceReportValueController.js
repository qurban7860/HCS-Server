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
const awsService = require('../../../base/aws');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const { Config } = require('../../config/models');
const { ProductServiceReports, ProductCheckItem, ProductServiceReportValue, ProductServiceReportValueFile } = require('../models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
this.populate = [
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

const getReportValue = async ( valueId ) => {
  try{
    const value = await this.dbservice.getObjectById(ProductServiceReportValue, this.fields, valueId, this.populate);
    return value
  } catch( error ){
    logger.error(new Error(error));
    throw new Error(error)
  }
};

exports.getProductServiceReportValue = async (req, res, next) => {
  try{
    const response = await getReportValue( req.params.id )
    res.json(response);
  } catch( error ){
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send( error?.message );
  }
};

exports.getProductServiceReportValues = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { name: 1 };
  this.dbservice.getObjectList(req, ProductServiceReportValue, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
}

exports.getProductServiceReportCheckItems = async (req, res) => {
  let populateObject = [
    { path: 'serviceReportTemplate', select: 'reportTitle reportType checkItemLists' },
    { path: 'createdBy', select: 'name' },
    { path: 'updatedBy', select: 'name' }
  ];

  try {
    const response =  await ProductServiceReports.findById( req.params.serviceReportId  ).populate( populateObject );
    if (!response) {
      return res.status(StatusCodes.BAD_REQUEST).send("Service Report Not Found!");
    }
    const values = await fetchServiceReportValues( req.params.serviceReportId );
    const responseData = JSON.parse(JSON.stringify(response?.serviceReportTemplate));
    
    if (response?.serviceReportTemplate && Array.isArray(response?.serviceReportTemplate?.checkItemLists)) {
      for (const [index, checkParam] of response.serviceReportTemplate.checkItemLists.entries()) {
        if (Array.isArray(checkParam?.checkItems)) {
          const checkItems = await fetchCheckItems(checkParam.checkItems);
          for (let checkItem of checkItems) {
            await updateCheckItemWithValues( checkItem, checkParam._id, values, response, req?.query?.highQuality || false );
          }
          responseData.checkItemLists[index].checkItems = checkItems
        }
      }
    }
    responseData.serviceReport = req.params.serviceReportId;
    res.json(responseData);
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

async function fetchServiceReportValues( serviceReport ) {
  try{
    const productServiceReportValues = await  ProductServiceReportValue.find(
      { serviceReport, isActive: true, isArchived: false },
      { checkItemValue: 1, comments: 1, serviceReport: 1, checkItemListId: 1, machineCheckItem: 1, createdBy: 1, updatedBy: 1, createdAt: 1, updatedAt: 1 }
    ).populate([{ path: 'createdBy', select: 'name' }, { path: 'updatedBy', select: 'name' }, { path: 'serviceReport', select: ' status', populate: { path: 'status', select: 'name type displayOrderNo' }}])
    .sort({ createdAt: -1 })
    .lean();
    return productServiceReportValues
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
    const orderedProductCheckItems = checkItemIds.map(id => 
      productCheckItems.find(item => item._id.toString() === id.toString())
    );
    
    return orderedProductCheckItems;
  } catch(e){
    logger.error(e);
    throw e;
  }
}

async function updateCheckItemWithValues(item, checkItemListId, values, Report, isHighQuality) {
  try {

    // Filter values to get historical data for the current check item
    const matchingValues = values.filter(val => 
      val.machineCheckItem.toString() === item._id.toString() &&
      val.checkItemListId.toString() === checkItemListId.toString()
    );
    const historicalData = await Promise.all(
      matchingValues.map(async (val) => ({
        ...val,
        files: await fetchCheckItemFiles(
          val.serviceReport?._id, 
          val.machineCheckItem, 
          val.checkItemListId, 
          val._id,
          isHighQuality
        ),
      }))
    );

    // Set historicalData to the check item, with the latest records first
    item.historicalData = historicalData;

    return item;
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

async function fetchCheckItemFiles(serviceReport, machineCheckItem, checkItemListId, checkItemValueId, isHighQuality ) {
  try{
    let productServiceReportValueFiles = await ProductServiceReportValueFile.find(
      { serviceReport, machineCheckItem, checkItemListId, checkItemValueId, isActive: true, isArchived: false }
    ).select('_id serviceReport name extension fileType thumbnail path').lean();
    if( isHighQuality ){
      productServiceReportValueFiles = await Promise.all(
        productServiceReportValueFiles.map(async ( file ) => await fetchFileFromAWS(file))
      );
    }
    return productServiceReportValueFiles
  } catch(e){
    logger.error(e);
    throw e;
  }
}

exports.deleteProductServiceReportValue = async (req, res, next) => {
  this.dbservice.deleteObject(ProductServiceReportValue, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductServiceReportValue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (!req.body.loginUser) {
      req.body.loginUser = await getToken(req);
    }
    req.body.machineId = req.params.machineId;

      const valueData = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      const response = await getReportValue(valueData?._id)
      response.machineId = req.params.machineId;

      let newResponse = { ...response?._doc, files: [] };

      const savedFiles = await handleServiceReportValueFiles(response, req, res);
      if (savedFiles?.length) {
        newResponse.files.push(...savedFiles);
      }

      return res.status(StatusCodes.CREATED).json(newResponse);

  } catch (e) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchProductServiceReportValue = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    if(!req.body.loginUser){
      req.body.loginUser = await getToken(req);
    }
    const findQuery = { 
      serviceReport: req.params?.serviceReportId, 
      machineCheckItem: req.params?.machineCheckItem, 
      checkItemListId: req.params?.checkItemListId, 
      checkItemValueId: req.params.id,
      isActive: true, 
      isArchived: false 
    }
    this.dbservice.patchObject(ProductServiceReportValue, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      } else {
        const response = await getReportValue( req.params.id ); 
        const checkItemFiles= await ProductServiceReportValueFile.find( findQuery ).select('_id name extension fileType thumbnail path').lean()
        let newResponse = { ...response?._doc, files: [] };

        if (Array.isArray(checkItemFiles) && checkItemFiles.length > 0) {
          newResponse.files.push(...checkItemFiles);
        }
        
        const savedFiles = await handleServiceReportValueFiles(response, req, res);
        if (savedFiles?.length) {
          newResponse.files.push(...savedFiles);
        }
        res.status(StatusCodes.ACCEPTED).json( newResponse );
      }
    }
  }
};

async function handleServiceReportValueFiles(checkitem, req, res) {
  try {
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
      req.body.machine = checkitem.machineId;
      req.body.serviceReport = checkitem?.serviceReport?._id;
      req.body.checkItemValueId = checkitem?._id;;
      req.body.name = processedFile.name;

      if (processedFile.base64thumbNailData) {
        req.body.thumbnail = processedFile.base64thumbNailData;
        req.body.name = processedFile.name;
      }

      const serviceReportCheckItemFileObject = await getServiceReportValueFileFromReq(req, 'new');
      await serviceReportCheckItemFileObject.save();
      return serviceReportCheckItemFileObject;
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
  try{
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
  } catch( error ){
    logger.error(new Error(error));
    throw new Error("File process failed!")
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
  const { serviceReport, machineCheckItem, checkItemListId, checkItemValue, comments, files , isHistory, isActive, isArchived, 
    loginUser } = req.body;
  
  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceReportValue({});
  }

  if ("serviceReport" in req.body) {
    doc.serviceReport = serviceReport;
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

  return doc;
}

async function fetchFileFromAWS(file) {
  try {
    if (file.path && file.path !== '' && file._id) {
      const data = await awsService.fetchAWSFileInfo(file._id, file.path);
      
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/tiff',
        'image/gif',
        'image/svg+xml'
      ];

      const isImage = file?.fileType && allowedMimeTypes.includes(file.fileType);

      let updatedFile = { ...file }; 
      if (isImage ) {
        const fileBase64 = await awsService.processAWSFile(data);
        return updatedFile = { ...updatedFile, src: fileBase64 };
      } 
      return file
    } else {
      throw new Error("Invalid File Provided!");
    }
  } catch (e) {
    console.error("Error fetching file from AWS:", e.message);
    throw new Error(e);
  }
}

function getServiceReportValueFileFromReq(req, reqType) {

  const { serviceReport, machineCheckItem, checkItemListId, checkItemValueId, path, extension, name, machine, fileType, awsETag, eTag, thumbnail, user, isActive, isArchived, loginUser } = req.body;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new ProductServiceReportValueFile({});
  }

  if ("serviceReport" in req.body) {
    doc.serviceReport = serviceReport;
  }

  if ("machineCheckItem" in req.body) {
    doc.machineCheckItem = machineCheckItem;
  }

  if ("checkItemListId" in req.body) {
    doc.checkItemListId = checkItemListId;
  }

  if ("checkItemValueId" in req.body) {
    doc.checkItemValueId = checkItemValueId;
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
