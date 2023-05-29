const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const path = require('path');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const fs = require('fs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const awsService = require('../../../../appsrc/base/aws');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let documentDBService = require('../service/documentDBService')
const dbservice = new documentDBService();

const { Document, DocumentType, DocumentCategory, DocumentFile, DocumentVersion } = require('../models');
const { Customer } = require('../../crm/models');
const { Machine } = require('../../products/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'documentType', select: 'name' },
  { path: 'category', select: 'name' },
  { path: 'customer', select: 'name' }
];



exports.getDocument = async (req, res, next) => {
  try {
    const response = await dbservice.getObjectById(Document, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    const response = await dbservice.getObjectList(Document, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const response = await dbservice.getObjectById(Document, this.fields, req.params.id, this.populate);
    if(response && response.id && response.isArchived==true) {
      const result = await dbservice.deleteObject(Document, req.params.id);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
    else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDelMessage(StatusCodes.BAD_REQUEST, 'Unable to delete document because it is not Archived'));
    }
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postDocument = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {

    if(!req.body.loginUser){
      req.body.loginUser = await getToken(req);
    }

    let files = req.files;
    let name = req.body.name;
    let customer = req.body.customer;
    let machine = req.body.machine;
    let documentType = req.body.documentType;
    let documentCategory = req.body.documentCategory;

    if(name && mongoose.Types.ObjectId.isValid(customer) && 
      mongoose.Types.ObjectId.isValid(documentType) && 
      mongoose.Types.ObjectId.isValid(documentCategory) || 
      mongoose.Types.ObjectId.isValid(machine)) {

      let docType = await dbservice.getObjectById(DocumentType,this.fields,documentType);
            
      if(!docType) 
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
      
      let cust = await dbservice.getObjectById(Customer,this.fields,customer);

      if(!cust) 
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));

      let mach = await dbservice.getObjectById(Machine,this.fields,machine);

      if(!mach) 
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));

      let docCat = await dbservice.getObjectById(DocumentCategory,this.fields,documentCategory);

      if(!docCat) 
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if(Array.isArray(files) && files.length>0) {
      let document_ = await dbservice.postObject(getDocumentFromReq(req, 'new'));

      if(!document_) 
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message:"Unable to save document"});
      
      req.body.versionNo = 1;
      let docuemntVersion = createDocumentVersionObj(document_,req.body);

      for(let file of files) {
        
        if(file && file.originalname) {

          const processedFile = await processFile(file, req.body.loginUser.userId);
          req.body.path = processedFile.s3FilePath;
          req.body.type = processedFile.type
          req.body.extension = processedFile.fileExt;
          req.body.content = processedFile.base64thumbNailData;
          req.body.originalname = processedFile.name;

          if(document_ && document_.id) {

            let documentFile = await saveDocumentFile(document_,req.body);

            if(docuemntVersion && documentFile && documentFile.id && 
              Array.isArray(docuemntVersion.files)) {

              docuemntVersion.files.push(documentFile.id);
              docuemntVersion = await docuemntVersion.save();
              documentFile.version = docuemntVersion.id;

            }
          }
        }
        
      }

      if(docuemntVersion && docuemntVersion.id && Array.isArray(document_.documentVersions)) {
        document_.documentVersions.push(docuemntVersion.id);
        document_ = await document_.save();
      }

      return res.status(StatusCodes.CREATED).json({ Document: response });

    }
    else {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  }
};

function createDocumentVersionObj(document_,file) {
  let docuemntVersion = new DocumentVersion({
    document :document_.id,
    versionNo:file.versionNo,
    customer:file.customer,
    isActive:file.isActive,
    isArchived:file.isArchived,
    createdBy : file.loginUser.userId,
    updatedBy : file.loginUser.userId,
    createdIP : file.loginUser.userIP,
    updatedIP : file.loginUser.userIP,
  });

  if(file.site && mongoose.Types.ObjectId.isValid(file.site)) {
    docuemntVersion.site = file.site;
  }

  if(file.contact && mongoose.Types.ObjectId.isValid(file.contact)) {
    docuemntVersion.contact = file.contact;
  }

  if(file.user && mongoose.Types.ObjectId.isValid(file.user)) {
    docuemntVersion.user = file.user;
  }

  if(file.machine && mongoose.Types.ObjectId.isValid(file.machine)) {
    docuemntVersion.machine = file.machine;
  }
  return docuemntVersion;
}

async function saveDocumentFile(document_,file) {

  let documentFile = new DocumentFile({
    document:document_.id,
    name:file.originalname,
    displayName:file.name,
    description:file.description,
    path:file.path,
    fileType:file.type,
    extension:file.extension,
    thumbnail:file.content,
    customer:file.customer,
    isActive:file.isActive,
    isArchived:file.isArchived,
    createdBy : file.loginUser.userId,
    updatedBy : file.loginUser.userId,
    createdIP : file.loginUser.userIP,
    updatedIP : file.loginUser.userIP,
  });

  if(file.site && mongoose.Types.ObjectId.isValid(file.site)) {
    documentFile.site = file.site;
  }

  if(file.contact && mongoose.Types.ObjectId.isValid(file.contact)) {
    documentFile.contact = file.contact;
  }

  if(file.user && mongoose.Types.ObjectId.isValid(file.user)) {
    documentFile.user = file.user;
  }

  if(file.machine && mongoose.Types.ObjectId.isValid(file.machine)) {
    documentFile.machine = file.machine;
  }

  return await documentFile.save();
} 

exports.patchDocument = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty() || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      
      let document_ = await dbservice.getObjectById(Document, this.fields, req.params.id);
      
      if(!document_)
        return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));

      let newVersion = req.body.newVersion;
      
      if(newVersion) {

        let documentVersion = await DocumentVersion.findOne({document:document_.id},{versionNo:-1})
        .sort({ versionNo:-1 });
        
        if(!documentVersion || isNaN(parseInt(documentVersion.versionNo))) 
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));

        req.body.versionNo = parseInt(documentVersion.versionNo) + 1;

        let docuemntVersion = createDocumentVersionObj(document_,req.body);

        for(let file of files) {
          
          if(file && file.originalname) {

            const processedFile = await processFile(file, req.body.loginUser.userId);
            req.body.path = processedFile.s3FilePath;
            req.body.type = processedFile.type
            req.body.extension = processedFile.fileExt;
            req.body.content = processedFile.base64thumbNailData;
            req.body.originalname = processedFile.name;

            if(document_ && document_.id) {

              let documentFile = await saveDocumentFile(document_,req.body);

              if(docuemntVersion && documentFile && documentFile.id && 
                Array.isArray(docuemntVersion.files)) {

                docuemntVersion.files.push(documentFile.id);
                docuemntVersion = await docuemntVersion.save();
                documentFile.version = docuemntVersion.id;

              }
            }
          }
          
        }

        if(docuemntVersion && docuemntVersion.id && Array.isArray(document_.documentVersions)) {
          document_.documentVersions.push(docuemntVersion.id);
          document_ = await document_.save();
        }


        return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, document_));
      }
      else {
        document_ = await dbservice.patchObject(Document, req.params.id, getDocumentFromReq(req));
        
        if(!document_)
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));

        return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, document_));

      }
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.downloadDocument = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const file = await dbservice.getObjectById(Document, this.fields, req.params.id, this.populate);
      if(file){
        if (file.path && file.path !== '') {
          const fileContent = await awsService.downloadFileS3(file.path);
          console.log("fileContent",fileContent);
          return res.status(StatusCodes.ACCEPTED).send(fileContent);
        }else{
          res.status(StatusCodes.NOT_FOUND).send(rtnMsg.recordCustomMessageJSON(StatusCodes.NOT_FOUND, 'Invalid file path', true));
        }
      }else{
        res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'File not found', true));
      }
    }
    catch(err){
      return err;
    }
  }
};

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
  return path.join('tmp/uploads', thumbnailName);
}

async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;

  const base64fileData = await readFileAsBase64(file.path);

  if(file.mimetype.includes('image')){
    thumbnailPath = await generateThumbnail(file.path);
    base64thumbNailData = await readFileAsBase64(thumbnailPath);
  }
  
  const fileName = userId+"-"+new Date().getTime();
  const s3FilePath = await awsService.uploadFileS3(fileName, 'uploads', base64fileData, fileExt);

  fs.unlinkSync(file.path);
  if(thumbnailPath){
    fs.unlinkSync(thumbnailPath);
  }
  
  if (!s3FilePath || s3FilePath === '') {
    throw new Error('AWS file saving failed');
  }
  else{
    return {
      fileName,
      name,
      fileExt,
      s3FilePath,
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

function getDocumentFromReq(req, reqType) {
  const { name, displayName, description, path, type, extension, content, 
    docType, documentVersions, docCategory, customer, customerAccess, site,
    contact, user, machine, isActive, isArchived, loginUser, versionPrefix, machineModel } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Document({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("displayName" in req.body) {
    doc.displayName = displayName;
  }
  if ("description" in req.body) {
    doc.description = description;
  }
  if ("path" in req.body) {
    doc.path = path;
  }
  if ("type" in req.body) {
    doc.type = type;
  }
  if ("extension" in req.body) {
    doc.extension = extension;
  }
  if ("documentType" in req.body) {
    doc.documentType = documentType;
  }
  if ("documentVersion" in req.body) {
    doc.documentVersion = documentVersion;
  }
  if ("category" in req.body) {
    doc.category = category;
  }
  if ("content" in req.body) {
    doc.content = content;
  }
  if ("customer" in req.body) {
    doc.customer = customer;
  }
  if ("customerAccess" in req.body) {
    doc.customerAccess = customerAccess;
  }
  if ("site" in req.body) {
    doc.site = site;
  }
  if ("contact" in req.body) {
    doc.contact = contact;
  }
  if ("user" in req.body) {
    doc.user = user;
  }
  if ("machine" in req.body) {
    doc.machine = machine;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if ("machineModel" in req.body) {
    doc.machineModel = machineModel;
  }

  if('versionPrefix' in req.body) {
    doc.versionPrefix = versionPrefix;
  }
  else {
    doc.versionPrefix = 'v';
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