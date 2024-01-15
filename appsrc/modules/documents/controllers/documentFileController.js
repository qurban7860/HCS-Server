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

const { Document, DocumentCategory, DocumentFile, DocumentVersion, DocumentAuditLog } = require('../models');
const { Customer } = require('../../crm/models');
const { Machine, ProductDrawing } = require('../../products/models');

const sizeOf = require('image-size');

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
  console.log(req.query.eTags.length);
  try {
      const eTagsArray = req.query.eTags.split(',');
      if(req?.query?.eTags && req?.query?.eTags.length > 0) {
        const filesResponse = [];
        for (const etag of req.query.eTags) {
          if (etag) {
            console.log("etag", etag);
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
            const queryString = {
              _id: { $in: filesList },
              $or: [
                { eTag: etag },
                { awsETag: etag }
              ]
            };
            const documentFiles = await DocumentFile.find(queryString).populate([{ path: 'version' }]);
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
                  const downloadFile = req?.query?.download === true || req?.query?.download === 'true' ? true : false;
                  console.log("downloadFile", downloadFile);
                  if(downloadFile){
                    console.log("Directly Downloading...............");
                    return res.status(StatusCodes.ACCEPTED).send(data.Body);
                  } else {
                    const isImage = file?.fileType && file.fileType.startsWith('image');
                    const isPDF = file?.fileType && file.fileType.toLowerCase().includes('pdf');

                    console.log("isImage", isImage);
                    console.log("isPDF", isPDF);
                    console.log("file?.fileType", file?.fileType);


                    if (isImage) {
                        console.log("isImage -->", isImage);
                        const dataReceived = data.Body.toString('utf-8');
                        const base64Data = dataReceived.replace(/^data:image\/\w+;base64,/, '');
                        const imageBuffer = Buffer.from(base64Data, 'base64');
                        const ImageResolution = await getImageResolution(imageBuffer);
                        console.log("ImageResolution", ImageResolution);
                        const desiredQuality = calculateDesiredQuality(imageBuffer, ImageResolution);
                        console.log("desiredQuality", desiredQuality);
                        sharp(imageBuffer)
                            .jpeg({
                                quality: desiredQuality,
                                mozjpeg: true
                            })
                            .toBuffer((resizeErr, outputBuffer) => {
                                if (resizeErr) {
                                    console.error('Error resizing image:', resizeErr);
                                    return;
                                } else {
                                    const base64String = outputBuffer.toString('base64');
                                    return res.status(StatusCodes.ACCEPTED).send(base64String);
                                }
                            });
                    } else if(isPDF) {
                      console.log("isPDF ........", isPDF);
                      const { PDFDocument } = require('@hopding/pdf-lib');
                      const inputBase64 = data.Body.toString('utf-8');
                      const base64Data = inputBase64.replace(/^data:application\/pdf;base64,/, '');
                      const pdfBuffer = Buffer.from(base64Data, 'base64');
                      console.log("pdf buffer.....");
                      PDFDocument.load(pdfBuffer).then(async (pdfDoc) => {
                        const modifiedPdfBytes = await pdfDoc.save();
                        const modifiedBase64 = modifiedPdfBytes.toString('base64');
                        console.log("all worked........ for pdf......");
                        return res.status(StatusCodes.ACCEPTED).send(modifiedBase64);
                      }).catch((err) => {
                        console.error('Error loading PDF document:', err);
                        return res.status(StatusCodes.ACCEPTED).send(data.Body);
                      });
                    } else {
                        console.log("ELSE");
                        return res.status(StatusCodes.ACCEPTED).send(data.Body);
                    }
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

async function getImageResolution(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    console.log(`Image Resolution: ${width} x ${height}`);
    
    // You can return the resolution or perform other actions as needed
    return { width, height };
  } catch (err) {
    console.error('Error reading image metadata:', err);
    throw err; // Propagate the error or handle it as per your application's requirements
  }
}

function calculateDesiredQuality(imageBuffer, imageResolution) {
  let desiredQuality = 100;

  // Set thresholds based on image size
  const sizeThresholds = {
    small: 2 * 1024 * 1024, // 2MB
    medium: 5 * 1024 * 1024, // 5MB
    large: 10 * 1024 * 1024, // 10MB
    extraLarge: 20 * 1024 * 1024, // 20MB
  };

  // Set resolution thresholds
  const resolutionThresholds = {
    low: 800,  // Low resolution threshold (e.g., 800 pixels)
    medium: 1200, // Medium resolution threshold (e.g., 1200 pixels)
    high: 2000, // High resolution threshold (e.g., 2000 pixels)
    extraHigh: 3000, // Extra high resolution threshold (e.g., 3000 pixels)
  };

  const imageSize = imageBuffer.length;
  const imageWidth = imageResolution.width;

  // Adjust quality based on image size
  if (imageSize > sizeThresholds.extraLarge) {
    desiredQuality = 10; // Aggressive reduction for extra-large images
  } else if (imageSize > sizeThresholds.large) {
    desiredQuality = 20; // Moderate reduction for large images
  } else if (imageSize > sizeThresholds.medium) {
    desiredQuality = 30; // Moderate reduction for medium-sized images
  } else {
    desiredQuality = 50; // Default quality for smaller images
  }

  // Adjust quality based on image resolution
  if (imageWidth < resolutionThresholds.low) {
    desiredQuality += 10; // Increase quality for low-resolution images
  } else if (imageWidth > resolutionThresholds.extraHigh) {
    desiredQuality -= 10; // Decrease quality for extra high-resolution images
  }

  // Ensure the desired quality stays within a reasonable range
  desiredQuality = Math.max(10, Math.min(100, desiredQuality));
  return desiredQuality;
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

  const base64fileData = await readFileAsBase64(file.path);

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