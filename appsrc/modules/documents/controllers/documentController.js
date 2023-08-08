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
const { Machine, MachineModel } = require('../../products/models');


this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'docType', select: 'name' },
  { path: 'docCategory', select: 'name' },
  { path: 'machineModel', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'name serialNo' },
  { path: 'site', select: 'name' },
];
this.populateHistory = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];



exports.getDocument = async (req, res, next) => {
  try {
    let document_ = await dbservice.getObjectById(Document, this.fields, req.params.id, this.populate);
    if(document_ && Array.isArray(document_.documentVersions) && document_.documentVersions.length>0) {
      
      document_ = JSON.parse(JSON.stringify(document_));

      let documentVersionQuery = {_id:{$in:document_.documentVersions},isArchived:false};
      let documentVersions = [];
      let historical = req.query.historical;
      

      
      if(historical) 
        documentVersions = await DocumentVersion.find(documentVersionQuery).select('files versionNo description updatedBy createdBy updatedIP createdIP createdAt updatedAt').sort({createdAt:-1}).populate(this.populateHistory);
      else 
        documentVersions = await DocumentVersion.find(documentVersionQuery).select('files versionNo description updatedBy createdBy updatedIP createdIP createdAt updatedAt').sort({createdAt:-1}).populate(this.populateHistory).limit(1);
      
      

      if(Array.isArray(documentVersions) && documentVersions.length>0) {
        documentVersions = JSON.parse(JSON.stringify(documentVersions));


        for(let documentVersion of documentVersions) {
          if(Array.isArray(documentVersion.files) && documentVersion.files.length>0) {
            let documentFileQuery = {_id:{$in:documentVersion.files},isArchived:false};
            let documentFiles = await DocumentFile.find(documentFileQuery).select('name displayName path extension fileType thumbnail');
            documentVersion.files = documentFiles;
          }
        }
      }
      document_.documentVersions = documentVersions;
    }
    res.json(document_);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};  
    if(this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    let basicInfo = false;

    if(this.query && (this.query.basic==true || this.query.basic=='true')) {
      basicInfo = true;
      delete this.query.basic;
    }


    if(this.query.forCustomer || this.query.forMachine || this.query.forDrawing) {

      let query;
      if(this.query.forCustomer && this.query.forMachine) {
        query = { $or : [ { customer : true } ,{ machine : true } ] };
        // this.query.customer = { $exists : false }; 
        // this.query.machine = { $exists : false }; 

        this.query.$or = [
          {customer: { '$exists': true }}, 
          {machine:{ '$exists': true }}
        ];
      }
      
      else if(this.query.forCustomer) 
        query = { customer:true };
      
      else if(this.query.forMachine) 
        query = { machine:true };
      
      else if(this.query.forDrawing) 
        query = { drawing:true };
      
      if(query) {

        let docCats = await DocumentCategory.find(query).select('_id').lean();

        if(Array.isArray(docCats) && docCats.length>0) {
          let docCatIds = docCats.map((dc)=>dc._id.toString());
          this.query.docCategory = {'$in':docCatIds};
          delete this.query.forCustomer;
          delete this.query.forMachine;
          delete this.query.forDrawing;
        }
      
      }
    }

    if(this.query.isArchived=='true')
      this.query.isArchived = true;

    if(this.query.isArchived=='false')
      this.query.isArchived = false;

    if(this.query.isActive=='true')
      this.query.isActive = true;
    
    if(this.query.isActive=='false')
      this.query.isActive = false;

    let documents = await dbservice.getObjectList(Document, this.fields, this.query, this.orderBy, this.populate);
    if(documents && Array.isArray(documents) && documents.length>0) {
      documents = JSON.parse(JSON.stringify(documents));
      let documentIndex = 0;
      for(let document_ of documents) {

        if(document_ && Array.isArray(document_.documentVersions) && document_.documentVersions.length>0) {
          
          document_ = JSON.parse(JSON.stringify(document_));

          let documentVersionQuery = {_id:{$in:document_.documentVersions},isArchived:false};
          let documentVersions = [];
          if(basicInfo===false) {
            documentVersions = await DocumentVersion.find(documentVersionQuery).select('files versionNo description').sort({createdAt:-1});
            if(Array.isArray(documentVersions) && documentVersions.length>0) {
              documentVersions = JSON.parse(JSON.stringify(documentVersions));

              for(let documentVersion of documentVersions) {
                if(Array.isArray(documentVersion.files) && documentVersion.files.length>0) {
                  let documentFileQuery = {_id:{$in:documentVersion.files},isArchived:false};
                  let documentFiles = await DocumentFile.find(documentFileQuery).select('name displayName path extension fileType thumbnail');
                  documentVersion.files = documentFiles;
                }
              }
            }
          }
          else {
            let documentVersion = await DocumentVersion.findOne(documentVersionQuery).select('versionNo description').sort({createdAt:-1});
            documentVersions = [documentVersion]
          }
          document_.documentVersions = documentVersions;
        }
        documents[documentIndex] = document_;
        documentIndex++;
      }
    }
    
    res.json(documents);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const document_ = await dbservice.getObjectById(Document, this.fields, req.params.id, this.populate);
    if(document_ && document_.id && document_.isArchived==true) {
      const result = await dbservice.deleteObject(Document, req.params.id);
      let documentAuditLogObj = {
        document : document_._id,
        activityType : "Delete",
        activitySummary : "Delete Document",
        activityDetail : "Delete Document permanently",
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

exports.postDocument = async (req, res, next) => {

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

      let name = req.body.name;
      let customer = req.body.customer;
      let machine = req.body.machine;
      let documentType = req.body.documentType;
      let site = req.body.site;
      let documentCategory = req.body.documentCategory;
      let machineModel = req.body.machineModel;
      if(name && mongoose.Types.ObjectId.isValid(documentType) && mongoose.Types.ObjectId.isValid(documentCategory)) {

        let docType = await dbservice.getObjectById(DocumentType,this.fields,documentType);
              
        if(!docType) {
          console.error("Document Type Not Found");
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }

        let docCategory = await dbservice.getObjectById(DocumentCategory,this.fields,documentCategory);
              
        if(!docCategory) {
          console.error("Document Category Not Found");
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }

        let cust = {}

        if(mongoose.Types.ObjectId.isValid(customer)) {
          cust = await dbservice.getObjectById(Customer,this.fields,customer);
          if(!cust || cust.isActive==false || cust.isArchived==true) {
            console.error("Customer Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        let site_ = {}

        if(mongoose.Types.ObjectId.isValid(site)) {
          site_ = await dbservice.getObjectById(CustomerSite, this.fields, site);
          if(!site_) {
            console.error("Site Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        let mach = {};
        if(mongoose.Types.ObjectId.isValid(machine)){

          mach = await dbservice.getObjectById(Machine,this.fields,machine);

          if(!mach) {
            console.error("Machine Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }


        let mModel = {};
        if(mongoose.Types.ObjectId.isValid(machineModel)){

          mModel = await dbservice.getObjectById(MachineModel,this.fields,machineModel);

          if(!mModel) {
            console.error("Machine Model Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        let docCat = await dbservice.getObjectById(DocumentCategory,this.fields,documentCategory);

        if(!docCat) {
          console.error("Category Not Found");

          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
        if(Array.isArray(files) && files.length>0) {
          let document_ = await dbservice.postObject(getDocumentFromReq(req, 'new'));

          if(!document_) {
            console.error("Unable to save document");

            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message:"Unable to save document"});
          }
  
          let versionNo_ = parseInt(req.body.versionNo);
  
          if(isNaN(versionNo_))
            req.body.versionNo = 1;
  
          let documentVersion = createDocumentVersionObj(document_,req.body);
          let documentFiles = [];
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

              if(document_ && document_.id) {

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
            
          }

          if(documentVersion && documentVersion.id && Array.isArray(document_.documentVersions)) {
            document_.documentVersions.push(documentVersion.id);
            document_ = await document_.save();
          }
          documentVersion = JSON.parse(JSON.stringify(documentVersion));
          documentVersion.files = dbFiles;
          document_ = JSON.parse(JSON.stringify(document_));
          document_.docType = docType;
          document_.docCategory = docCategory;
          document_.documentVersions = [documentVersion];
          document_.customer = cust;
          let documentAuditLogObj = {
            document : document_._id,
            activityType : "Create",
            activitySummary : "Create Document",
            activityDetail : "Document created successfully",
          }

          await createAuditLog(documentAuditLogObj,req);
          return res.status(StatusCodes.CREATED).json({ Document: document_ });

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
  if(!documentAuditLogObj.document)
    return console.log('Document id not found');
  
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

function createDocumentVersionObj(document_,file) {
  let documentVersion = new DocumentVersion({
    document :document_.id,
    versionNo:file.versionNo,
    customer:file.customer,
    description:file.description,
    isActive:file.isActive,
    isArchived:file.isArchived,
  });

  if(file.loginUser) {
    documentVersion.createdBy = documentVersion.updatedBy = file.loginUser.userId
    documentVersion.createdIP = documentVersion.updatedIP = file.loginUser.userIP
  }

  if(file.site && mongoose.Types.ObjectId.isValid(file.site)) {
    documentVersion.site = file.site;
  }

  if(file.contact && mongoose.Types.ObjectId.isValid(file.contact)) {
    documentVersion.contact = file.contact;
  }

  if(file.user && mongoose.Types.ObjectId.isValid(file.user)) {
    documentVersion.user = file.user;
  }

  if(file.machine && mongoose.Types.ObjectId.isValid(file.machine)) {
    documentVersion.machine = file.machine;
  }
  return documentVersion;
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

exports.patchDocument = async (req, res, next) => {
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

      let document_ = await dbservice.getObjectById(Document, this.fields, req.params.id,this.populate);
      

      if(!document_)
        return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));

      let name = req.body.name;
      let customer = req.body.customer;
      let machine = req.body.machine;
      let documentType = req.body.documentType;
      let site = req.body.site;
      let documentCategory = req.body.documentCategory;
      let archiveStatus = req.body.isArchived;

      if(name && mongoose.Types.ObjectId.isValid(documentType) && mongoose.Types.ObjectId.isValid(documentCategory) ) {

        let docType = await dbservice.getObjectById(DocumentType,this.fields,documentType);
              
        if(!docType) {
          console.error("Document Type Not Found");
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }

        let site_ = {}
        if(mongoose.Types.ObjectId.isValid(site)) {
          site_ = await dbservice.getObjectById(CustomerSite, this.fields, site);
          if(!site_) {
            console.error("Site Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        let docCategory = await dbservice.getObjectById(DocumentCategory,this.fields,documentCategory);
              
        if(!docCategory) {
          console.error("Document Category Not Found");
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
      }
      
      let newVersion = req.body.newVersion;
      
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

      if(newVersion) {

        if(Array.isArray(files) && files.length>0) {

          let documentVersion = await DocumentVersion.findOne({document:document_.id, isArchived:false},{versionNo:1})
          .sort({ versionNo:-1 });
          let version = 0;

          if(!documentVersion || isNaN(parseInt(documentVersion.versionNo))) 
            version = 1;
          else 
            version = parseInt(documentVersion.versionNo) + 1;

          req.body.versionNo = version;

          documentVersion = createDocumentVersionObj(document_,req.body);

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

              if(document_ && document_.id) {

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
          }
          if(documentVersion && documentVersion.id && Array.isArray(document_.documentVersions)) {
            document_.documentVersions.push(documentVersion.id);
            document_ = await document_.save();
          }
          await dbservice.patchObject(Document, req.params.id, getDocumentFromReq(req));
          document_ = await dbservice.getObjectById(Document, this.fields, req.params.id,this.populate);
          document_ = JSON.parse(JSON.stringify(document_));
          documentVersion = JSON.parse(JSON.stringify(documentVersion));
          documentVersion.files = dbFiles;
          document_.documentVersions = [documentVersion];

          let documentAuditLogObj = {
            document : document_._id,
            activityType : "Update",
            activitySummary : "Update Document",
            activityDetail : "New Version Created",
          }

          if(archiveStatus && archiveStatus!=document_.isArchived && 
            document_.isArchived==true) {
            documentAuditLogObj.activityType = 'SoftDelete';
            documentAuditLogObj.activitySummary = 'Document Archived';
            documentAuditLogObj.activityDetail = 'Document Archived';
          }

          await createAuditLog(documentAuditLogObj,req);
          return res.status(StatusCodes.ACCEPTED).json(document_);
        }
        else 
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
      
      }
      else {
        
        let documentVersion = await DocumentVersion.findOne({document:document_.id, isArchived:false})
        .sort({ versionNo:-1 });
        let dbFiles = []

        if(Array.isArray(files) && files.length>0) {
          if(!documentVersion || isNaN(parseInt(documentVersion.versionNo))) 
            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));

          for(let file of files) {
              
            if(file && file.originalname) {

              const processedFile = await processFile(file, req.body.loginUser.userId);
              req.body.path = processedFile.s3FilePath;
              req.body.type = processedFile.type
              req.body.extension = processedFile.fileExt;
              
              if(processedFile.base64thumbNailData)
                req.body.content = processedFile.base64thumbNailData;
              
              req.body.originalname = processedFile.name;

              if(document_ && document_.id) {

                let documentFile = await saveDocumentFile(document_,req.body);
                if(documentVersion && documentFile && documentFile.id && 
                  Array.isArray(documentVersion.files)) {
                  dbFiles.push(documentFile);
                  documentVersion.files.push(documentFile.id);
                  documentVersion = await documentVersion.save();
                  documentFile.version = documentVersion.id;
                  documentFile = await documentFile.save();
                }
              }
            }
          }

        }

        await dbservice.patchObject(Document, req.params.id, getDocumentFromReq(req));
        document_ = await dbservice.getObjectById(Document, this.fields, req.params.id,this.populate);

        document_ = JSON.parse(JSON.stringify(document_));
        documentVersion = JSON.parse(JSON.stringify(documentVersion));
        documentVersion.files = dbFiles;
        document_.documentVersions = [documentVersion];
        
        let documentAuditLogObj = {
          document : document_._id,
          activityType : "Update",
          activitySummary : "Update Document",
          activityDetail : "Update Existing version",
        }

        await createAuditLog(documentAuditLogObj,req);

        return res.status(StatusCodes.ACCEPTED).json(document_);
      }
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
    if(thumbnailPath) {
      base64thumbNailData = await readFileAsBase64(thumbnailPath);
    }
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
    documentVersions, documentCategory, customer, customerAccess, site,
    contact, user, machine, isActive, isArchived, loginUser, versionPrefix, 
    machineModel, documentType, shippingDate, installationDate, referenceNumber } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Document({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }

  if ("referenceNumber" in req.body) {
    doc.referenceNumber = referenceNumber;
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
  if ("installationDate" in req.body){
    doc.installationDate = installationDate;
  }
  if ("shippingDate" in req.body){
    doc.shippingDate = shippingDate;
  }
  if ("documentType" in req.body) {
    doc.docType = documentType;
  }
  if ("documentVersion" in req.body) {
    doc.documentVersion = documentVersion;
  }
  if ("documentCategory" in req.body) {
    doc.docCategory = documentCategory;
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