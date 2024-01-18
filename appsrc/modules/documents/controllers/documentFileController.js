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

const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let documentDBService = require('../service/documentDBService')
const dbservice = new documentDBService();

const { Document, DocumentCategory, DocumentFile, DocumentVersion, DocumentAuditLog } = require('../models');
const { Customer } = require('../../crm/models');
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


exports.getDocumentFile = async (req, res, next) => {
  try {
    let documentFile = await dbservice.getObjectById(DocumentFile, this.fields, req.params.id, this.populate);
    
    if(!documentFile) 
      return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));
    
    res.json(documentFile);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentFiles = async (req, res, next) => {
  try {
    
    this.query = req.query != "undefined" ? req.query : {};  
    
    let documentFiles = await dbservice.getObjectList(req, DocumentFile, this.fields, this.query, this.orderBy, this.populate);
    
    res.json(documentFiles);
  
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// exports.checkFileExistenceByETag = async (req, res, next) => {
//   try {
//     if (req.files?.images && req.files?.images.length > 0 && req.files?.images[0]?.path) {
//       console.log("req.files?", req.files.images);
      
//       let etag = await awsService.generateEtag(req.files.images[0].path);
      
      
//       const documentCategoryIds = await DocumentCategory.find({drawing: true, isActive: true, isArchived: false}).select('_id');

//       let documentIds = await Document.find({docCategory: {$in: documentCategoryIds}, isActive: true, isArchived: false}).select('_id');
//       console.log("documentIds", documentIds);
      
//       let latestVersions = await DocumentVersion.aggregate([
//         {
//           $match: {
//             document: { $in: documentIds }
//           }
//         },
//         {
//           $sort: { versionNo: -1 }
//         },
//         {
//           $group: {
//             _id: '$document',
//             latestVersion: { $first: '$$ROOT' }
//           }
//         },
//         {
//           $replaceRoot: { newRoot: '$latestVersion' }
//         }
//       ]);

//       let filesList = latestVersions.flatMap(version => version.files);

//       console.log("filesList", filesList);


//       const queryString = { _id: { $in: filesList } , 
//       $or: [
//           { eTag: etag },
//           { awsETag: etag }
//           // Add more conditions as needed
//         ]
//       };

//       console.log("queryString", queryString);
      
//       const documentFiles = await DocumentFile.find(queryString).populate([{ path: 'version'}]);

//       if (documentFiles && documentFiles.length > 0) {
//         res.status(409).send({
//           message: `File already exists against.`,
//           documentFiles
//         });
//       } else {
//         res.status(200).send(`No file found against.`);
//       }
//     } else {
//       res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//     }
//   } catch (error) {
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error generating ETag: ${error.message}`);
//   }
// };


exports.checkFileExistenceByETag = async (req, res, next) => {
  console.log("eTags", req.query.eTags);
  try {
      if(req?.query?.eTags && req?.query?.eTags.length > 0) {
        const filesResponse = [];

        const documentCategoryIds = await DocumentCategory.find({ drawing: true, isActive: true, isArchived: false }).select('_id');
        let documentLists = await Document.find({ docCategory: { $in: documentCategoryIds }, isActive: true, isArchived: false }).select('_id');
        let documentIds = documentLists.map(dc => dc._id);
        let latestVersions = await DocumentVersion.aggregate([
          {
            $match: {
              document: { $in: documentIds }
            }
          },
          {
            $sort: { versionNo: -1 }
          },
          {
            $group: {
              _id: '$document',
              latestVersion: { $first: '$$ROOT' }
            }
          },
          {
            $replaceRoot: { newRoot: '$latestVersion' }
          }
        ]);
        let filesList = latestVersions.flatMap(version => version.files);

        for (const etag of req.query.eTags) {
          if (etag) {
            const queryString = {
              _id: { $in: filesList },
              $or: [
                { eTag: etag },
                { awsETag: etag }
              ]
            };
            // const documentFiles = await DocumentFile.find(queryString).populate([{ path: 'version' }]);
            const documentFiles = await DocumentFile.find(queryString).populate({
              path: 'version',
              populate: {
                path: 'document',
                model: 'Document',
                select: 'name displayName'
              },
            }).select('-thumbnail');

            if (documentFiles && documentFiles.length > 0) {
              filesResponse.push({
                etag,
                status: 409,
                message: `File already exists against.`,
                documentFiles
              });
            } else {
              filesResponse.push({
                etag,
                status: 200,
                message: `No file found against.`
              });
            }
          } else {
            filesResponse.push({
              file: 'Unknown',
              status: StatusCodes.INTERNAL_SERVER_ERROR,
              message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
            });
          }
        }
        res.status(200).send(filesResponse);
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`No eTag Received`);
      }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error generating ETag: ${error.message}`);
  }
};


exports.deleteDocumentFile = async (req, res, next) => {
  try {
    const response = await dbservice.getObjectById(DocumentFile, this.fields, req.params.id, this.populate);
    if(response && response.id && response.isArchived==true) {
      const result = await dbservice.deleteObject(DocumentFile, req.params.id);

      let documentAuditLogObj = {
        documentFile : response._id,
        activityType : "Delete",
        activitySummary : "Delete DocumentFile",
        activityDetail : "Delete DocumentFile permanently",
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

exports.postDocumentFile = async (req, res, next) => {

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
      let customer = req.body.customer;
      let versionID = req.params.versionid;
      let machine = req.body.machine;

      if(name && mongoose.Types.ObjectId.isValid(versionID)) {

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
            console.error("Invalid machine for documentFile");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }
        

        let documentVersion = await dbservice.getObjectById(DocumentVersion, this.fields, versionID,this.populate);
        
        if(!documentVersion || documentVersion.isArchived) {
          console.error("Invalid documentVersion for documentFile");

          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }
          
        const processedFile = await processFile(file, req.body.loginUser.userId);
        req.body.path = processedFile.s3FilePath;
        req.body.fileType =req.body.type = processedFile.type
        req.body.extension = processedFile.fileExt;
        req.body.awsETag = processedFile.awsETag;
        req.body.eTag = processedFile.eTag;

        if(processedFile.base64thumbNailData)
          req.body.content = processedFile.base64thumbNailData;
        req.body.originalname = processedFile.name;
        req.body.document = documentVersion.document;

        let documentFile = await dbservice.postObject(getDocumentFromReq(req, 'new'));

        if(documentVersion && documentFile && documentFile.id && 
          Array.isArray(documentVersion.files)) {

          documentVersion.files.push(documentFile.id);
          documentVersion = await documentVersion.save();
          documentFile.version = documentVersion.id;
          documentFile = await documentFile.save();
        } 
       

        documentFile = JSON.parse(JSON.stringify(documentFile));
        documentFile.customer = cust;

        let documentAuditLogObj = {
          documentFile : documentFile._id,
          activityType : "Create",
          activitySummary : "Create DocumentFile",
          activityDetail : "DocumentFile created successfully",
        }

        await createAuditLog(documentAuditLogObj,req);
        return res.status(StatusCodes.CREATED).json(documentFile);

        
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
  if(!documentAuditLogObj.documentFile)
    return console.log('DocumentFile id not found');
  
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

exports.patchDocumentFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty() || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      
      if(!req.body.loginUser){
        req.body.loginUser = await getToken(req);
      }

      let archiveStatus = req.body.isArchived;
      let name = req.body.name;
      let customer = req.body.customer;
      let versionID = req.params.versionid;
        
      let documentFile = await dbservice.getObjectById(DocumentFile, this.fields, req.params.id,this.populate);

      let documentVersion = {};
      if(!documentFile)
        return res.status(StatusCodes.NOT_FOUND).send(getReasonPhrase(StatusCodes.NOT_FOUND));

      if(name && mongoose.Types.ObjectId.isValid(versionID)) {

        let cust = {}

        if(mongoose.Types.ObjectId.isValid(customer)) {
          cust = await dbservice.getObjectById(Customer,this.fields,customer);
          if(!cust || cust.isActive==false || cust.isArchived==true) {
            console.error("Customer Not Found");

            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
          }
        }

        documentVersion = await dbservice.getObjectById(DocumentVersion, this.fields, versionID,this.populate);
        
        if(!documentVersion || documentVersion.isArchived) {
          console.error("Invalid document for documentVersion.");
          return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        }

      }
      
      await dbservice.patchObject(DocumentFile, req.params.id, getDocumentFromReq(req));
      documentFile = await dbservice.getObjectById(DocumentFile, this.fields, req.params.id,this.populate);

      let documentAuditLogObj = {
        documentFile : documentFile._id,
        activityType : "Update",
        activitySummary : "Update Document File",
        activityDetail : "Document File Updated",
      }

      if(archiveStatus && archiveStatus!=documentVersion.isArchived && 
        documentVersion.isArchived==true) {
        documentAuditLogObj.activityType = 'SoftDelete';
        documentAuditLogObj.activitySummary = 'Document File Archived';
        documentAuditLogObj.activityDetail = 'Document File Archived';
      }

      await createAuditLog(documentAuditLogObj,req);

      return res.status(StatusCodes.ACCEPTED).json(documentFile);
      
    
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.downloadDocumentFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      console.log(errors)
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
      try {
          const file = await dbservice.getObjectById(DocumentFile, this.fields, req.params.id, this.populate);
          if (file) {
              if (file.path && file.path !== '') {
                  const data = await awsService.fetchAWSFileInfo(file._id, file.path);
                  const isImage = file?.fileType && file.fileType.startsWith('image');
        
                  const regex = new RegExp("^OPTIMIZE_IMAGE_ON_DOWNLOAD$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
        
                  console.log(data);
                  if (isImage && configObject) {
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
          if (data.Body)
              return res.status(StatusCodes.ACCEPTED).send(data.Body);
          else
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

function getDocumentFromReq(req, reqType) {
  const { customer, isActive, isArchived, loginUser, documentVersion , description,
  name, displayName, user, site, contact, machine, fileType, awsETag, eTag } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new DocumentFile({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("displayName" in req.body) {
    doc.displayName = displayName;
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

  if ("description" in req.body) {
    doc.description = description;
  }
  
  if ("customer" in req.body) {
    doc.customer = customer;
  }
  
  if ("isActive" in req.body) {
    doc.isActive = isActive;
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


  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if ("documentVersion" in req.body) {
    doc.documentVersion = documentVersion;
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