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

const { Document, DocumentType, DocumentCategory, DocumentFile, DocumentVersion, DocumentAuditLog } = require('../models');
const { Customer, CustomerSite } = require('../../crm/models');
const { Machine } = require('../../products/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'document', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'customer', select: 'name' },
];


exports.getDocumentVersion = async (req, res, next) => {
  try {
    let documentVersion = await dbservice.getObjectById(DocumentVersion, this.fields, req.params.id, this.populate);
    if(documentVersion && Array.isArray(documentVersion.files) && documentVersion.files.length>0) {
      
      documentVersion = JSON.parse(JSON.stringify(documentVersion));

      let documentFilesQuery = {
        _id : {
          $in:documentVersion.files
        },

        isArchived:false
      };
      
      let documentFiles = await DocumentFile.find(documentFilesQuery).sort({createdAt:-1});
      
      documentVersion.files = documentFiles;
    }
    res.json(documentVersion);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentVersions = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    this.query.document = req.params.documentid;
    let documentVersions = await dbservice.getObjectList(DocumentVersion, this.fields, this.query, this.orderBy, this.populate);
    
    if(documentVersions && Array.isArray(documentVersions) && documentVersions.length>0) {
      documentVersions = JSON.parse(JSON.stringify(documentVersions));
    
      let documentVersionIndex = 0;
    
      for(let documentVersion of documentVersions) {

        if(documentVersion && Array.isArray(documentVersion.files) && documentVersion.files.length>0) {
          
          documentVersion = JSON.parse(JSON.stringify(documentVersion));

          let documentFilesQuery = {
            _id:{
              $in:documentVersion.files
            },
            isArchived:false
          };

          let files = await DocumentFile.find(documentFilesQuery).sort({createdAt:-1});
          if(Array.isArray(files) && files.length>0) {
            files = JSON.parse(JSON.stringify(files));

            for(let file of files) {
              if(Array.isArray(documentVersion.files) && documentVersion.files.length>0) {
                let documentFileQuery = {_id:{$in:documentVersion.files},isArchived:false};
                let documentFiles = await DocumentFile.find(documentFileQuery).select('name displayName path extension fileType thumbnail');
                documentVersion.files = documentFiles;
              }
            }
          }
          documentVersion.files = files;
        }
        documentVersions[documentVersionIndex] = documentVersion;
        documentVersionIndex++;
      }
    }
    
    res.json(documentVersions);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteDocumentVersion = async (req, res, next) => {
  try {
    const response = await dbservice.getObjectById(DocumentVersion, this.fields, req.params.id, this.populate);
    if(response && response.id && response.isArchived==true) {
      const result = await dbservice.deleteObject(DocumentVersion, req.params.id);

      let documentAuditLogObj = {
        documentVersion : response._id,
        activityType : "Delete",
        activitySummary : "Delete DocumentVersion",
        activityDetail : "Delete DocumentVersion permanently",
      }

      await createAuditLog(documentAuditLogObj,req);
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

exports.postDocumentVersion = async (req, res, next) => {

  try{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {

      if(!req.body.loginUser){
        req.body.loginUser = await getToken(req);
      }

      let files = [];
        
      if(req.files && req.files.images)
        files = req.files.images;

      let customer = req.body.customer;
      let machine = req.body.machine;
      let documentID = req.params.documentid;

      if(mongoose.Types.ObjectId.isValid(documentID)) {

        let cust = {}

        if(mongoose.Types.ObjectId.isValid(customer)) {
          cust = await dbservice.getObjectById(Customer,this.fields,customer);
          if(!cust || cust.isActive==false || cust.isArchived==true) {
            console.error("Customer Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        let mach = {}

        if(mongoose.Types.ObjectId.isValid(machine)) {
          mach = await dbservice.getObjectById(Machine, this.fields, machine);
          if(!mach || mach.isActive==false || mach.isArchived==true) {
            console.error("Invalid machine for documentVersion");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        let document_ = await dbservice.getObjectById(Document, this.fields, documentID,this.populate);
        
        if(!document_ || document_.isArchived) {
          console.error("Invalid document for documentVersion");

          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }

        if(Array.isArray(files) && files.length>0) {

          let versionNo_ = parseInt(req.body.versionNo);
  
          if(isNaN(versionNo_)) {
            let documentVersion = await DocumentVersion.findOne({document:document_.id, isArchived:false},{versionNo:1})
            .sort({ versionNo:-1 });
            let version = 0;

            if(!documentVersion || isNaN(parseInt(documentVersion.versionNo))) 
              version = 1;
            else 
              version = parseInt(documentVersion.versionNo) + 1;            

            req.body.versionNo = version;

          }
          else {
            req.body.versionNo = versionNo_;
          }

          req.body.document = document_.id;
          documentVersion = await dbservice.postObject(getDocumentFromReq(req, 'new'));

          if(!documentVersion) {
            console.error("Unable to save document");

            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message:"Unable to save document"});
          }
          
          let documentFiles = [];
          let dbFiles = [];

          for(let file of files) {
            
            if(file && file.originalname) {

              const processedFile = await processFile(file, req.body.loginUser.userId);
              req.body.path = processedFile.s3FilePath;
              req.body.type = processedFile.type
              req.body.extension = processedFile.fileExt;
  
              if(processedFile.base64thumbNailData)
                req.body.content = processedFile.base64thumbNailData;
  
              req.body.originalname = processedFile.name;


              let documentFile = await saveDocumentFile(document_,req.body);

              if(documentVersion && documentFile && documentFile.id && 
                Array.isArray(documentVersion.files)) {

                documentVersion.files.push(documentFile.id);
                dbFiles.push(documentFile);
                documentVersion = await documentVersion.save();
                documentFile.version = documentVersion.id;
                documentFile = await documentFile.save();
              }
            }
            
          }

          if(documentVersion && documentVersion.id && Array.isArray(document_.documentVersions)) {
            document_.documentVersions.push(documentVersion.id);
            document_ = await document_.save();
          }

          documentVersion = JSON.parse(JSON.stringify(documentVersion));
          documentVersion.customer = cust;

          let documentAuditLogObj = {
            documentVersion : documentVersion._id,
            activityType : "Create",
            activitySummary : "Create DocumentVersion",
            activityDetail : "Document Version created successfully",
          }

          await createAuditLog(documentAuditLogObj,req);
          return res.status(StatusCodes.CREATED).json(documentVersion);

        }
        else {
          console.error("Files Not Found");

          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
      }
      else {
        console.error("Invalid Data");

        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
      }

    }
  }catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message:"Unable to save document"});

  }
};

async function createAuditLog(documentAuditLogObj,req) {
  if(!documentAuditLogObj.documentVersion)
    return console.log('DocumentVersion id not found');
  
  if(!req.body.loginUser)
    req.body.loginUser = await getToken(req);
  documentAuditLogObj.isActive = true;
  documentAuditLogObj.isArchived = false;
  if(req.body.loginUser) {
    documentAuditLogObj.createdBy = documentAuditLogObj.updatedBy = req.body.loginUser.userId
    documentAuditLogObj.createdIP = documentAuditLogObj.updatedIP = req.body.loginUser.userIP
  }
  documentAuditLogObj = new DocumentAuditLog(documentAuditLogObj);
  await documentAuditLogObj.save();
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
    isArchived:file.isArchived
  });

  if(file.loginUser) {
    documentFile.createdBy = documentFile.updatedBy = file.loginUser.userId
    documentFile.createdIP = documentFile.updatedIP = file.loginUser.userIP
  }

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

exports.patchDocumentVersion = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty() || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      
      if(!req.body.loginUser){
        req.body.loginUser = await getToken(req);
      }

      let files = [];
      
      if(req.files && req.files.images)
        files = req.files.images;

      let archiveStatus = req.body.isArchived;
      let name = req.body.name;
      let customer = req.body.customer;
      let documentID = req.params.documentid;
      
      let document_ = {};
      let documentVersion = await dbservice.getObjectById(DocumentVersion, this.fields, req.params.id,this.populate);

      if(!documentVersion)
        return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));

      if(name && mongoose.Types.ObjectId.isValid(documentID) ) {

        let cust = {}

        if(mongoose.Types.ObjectId.isValid(customer)) {
          cust = await dbservice.getObjectById(Customer,this.fields,customer);
          if(!cust || cust.isActive==false || cust.isArchived==true) {
            console.error("Customer Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        document_ = await dbservice.getObjectById(Document, this.fields, documentID,this.populate);
        
        if(!document_ || document_.isArchived) {
          console.error("Invalid document for documentVersion");

          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
      }
      
      if(req.body.customerAccess=='true' || req.body.customerAccess===true)
        req.body.customerAccess = true;

      if(req.body.customerAccess=='false' || req.body.customerAccess===false)
        req.body.customerAccess = false;

      if(req.body.isActive=='true' || req.body.isActive===true)
        req.body.isActive = true;

      if(req.body.isActive=='false' || req.body.isActive===false)
        req.body.isActive = false;
      
      if(req.body.isArchived=='true' || req.body.isArchived===true)
        req.body.isArchived = true;

      if(req.body.isArchived=='false' || req.body.isArchived===false)
        req.body.isArchived = false;


      if(Array.isArray(files) && files.length>0) {

        let dbFiles = []
        for(let file of files) {
            
          if(file && file.originalname) {

            const processedFile = await processFile(file, req.body.loginUser.userId);
            req.body.path = processedFile.s3FilePath;
            req.body.type = processedFile.type
            req.body.extension = processedFile.fileExt;
  
            if(processedFile.base64thumbNailData)
              req.body.content = processedFile.base64thumbNailData;
  
            req.body.originalname = processedFile.name;

            let documentFile = await saveDocumentFile(document_,req.body);

            if(documentVersion && documentFile && documentFile.id && 
              Array.isArray(documentVersion.files)) {

              documentVersion.files.push(documentFile.id);
              dbFiles.push(documentFile);
              documentVersion = await documentVersion.save();

              documentFile.version = documentVersion.id;
              documentFile = await documentFile.save();

            }
          }
        }

        if(documentVersion && documentVersion.id && Array.isArray(document_.documentVersions)) {
          document_.documentVersions.push(documentVersion.id);
          document_ = await document_.save();
        }

        await dbservice.patchObject(DocumentVersion, req.params.id, getDocumentFromReq(req));

        documentVersion = await dbservice.getObjectById(DocumentVersion, this.fields, req.params.id,this.populate);
        documentVersion = JSON.parse(JSON.stringify(documentVersion));
        documentVersion.files = dbFiles;


        let documentAuditLogObj = {
          documentVersion : documentVersion._id,
          activityType : "Update",
          activitySummary : "Update Document Version",
          activityDetail : "Document Version Updated",
        }

        if(archiveStatus && archiveStatus!=documentVersion.isArchived && 
          documentVersion.isArchived==true) {
          documentAuditLogObj.activityType = 'SoftDelete';
          documentAuditLogObj.activitySummary = 'DocumentVersion Archived';
          documentAuditLogObj.activityDetail = 'DocumentVersion Archived';
        }

        await createAuditLog(documentAuditLogObj,req);
        return res.status(StatusCodes.ACCEPTED).json(documentVersion);
      }
      else 
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
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
  return path.join(process.env.UPLOAD_PATH, thumbnailName);
}

async function processFile(file, userId) {
  const { name, ext } = path.parse(file.originalname);
  const fileExt = ext.slice(1);
  let thumbnailPath;
  let base64thumbNailData;

  const base64fileData = await readFileAsBase64(file.path);

  if(file.mimetype.includes('image')){
    thumbnailPath = await generateThumbnail(file.path);
    if(thumbnailPath)
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
  const { customer, isActive, isArchived, loginUser, versionPrefix, document, description,
  name, displayName, user, site, contact, machine, versionNo } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new DocumentVersion({});
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

  if ("versionNo" in req.body) {
    doc.versionNo = versionNo;
  }
  
  

  if ("customer" in req.body) {
    doc.customer = customer;
  }

  if ("user" in req.body) {
    doc.user = user;
  }

  if ("site" in req.body) {
    doc.site = site;
  }

  if ("contact" in req.body) {
    doc.contact = contact;
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

  if ("document" in req.body) {
    doc.document = document;
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