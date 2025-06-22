const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const awsService = require('../../../base/aws');
const { Config } = require('../../config/models');
let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const { ProductProfile, ProductProfileFile } = require('../models');
const { processFile } = require('../../files/utils');


exports.getProductProfileFiles = async (req, res, next) => {
  try {
    const profile = req?.params?.profileId
    this.query = req.query != "undefined" ? req.query : { profile: profile, isArchived: false, isActive: true };
    this.query.machine = req.params.machineId;
    await this.dbservice.getObjectList(req, ProductProfileFile, this.fields, this.query, this.orderBy, this.populate);
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

const saveFiles = async (req, res, next) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {

      let files = [];

      if (req?.files?.images) {
        files = req.files.images;
      } else {
        return
      }

      const fileProcessingPromises = files?.map(async (file) => {
        if (!file || !file.originalname) {
          logger.error('File not found!');
          throw new Error('File not found!');
        }

        const processedFile = await processFile(file, req.body?.loginUser?.userId, process.env.S3_PRODUCT_PROFILE_FOLDER_NAME);

        req.body = {
          loginUser: req.body.loginUser,
          path: processedFile.s3FilePath,
          fileType: processedFile.type,
          extension: processedFile.fileExt,
          awsETag: processedFile.awsETag,
          eTag: processedFile.eTag,
          profile: req.params.profileId,
          machine: req.params.machineId,
          name: processedFile.name,
          thumbnail: processedFile.base64thumbNailData || undefined,
        };

        const profileFile = await getDocFromReq(req, 'new');
        return this.dbservice.postObject(profileFile);

      });

      const savedFiles = await Promise.all(fileProcessingPromises);
      if (Array.isArray(savedFiles) && savedFiles?.length > 0) {
        const filesIds = savedFiles?.map(sf => sf?._id)
        const isUpdated = await this.dbservice.patchObject(ProductProfile, req.params.profileId, { $push: { files: { $each: filesIds } } });
      }
      return savedFiles;
    }
  } catch (error) {
    logger.error(new Error(error));
    throw error
  }
};

exports.saveFiles = saveFiles;

exports.postFiles = async (req, res, next) => {
  try {
    const savedFiles = await saveFiles(req);
    return res.status(StatusCodes.OK).send({ files: savedFiles });
  } catch (e) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Files save failed!");
  }
};

exports.downloadFile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(new Error(error));
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const file = await ProductProfileFile.findOne({ _id: req.params.id }).select('path');
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
          let configObject = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true : false;
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
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "File download failed!");
    }
  }
};

exports.patchProductProfileFile = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    await this.dbservice.patchObject(ProductProfileFile, req.params.id, getDocFromReq(req));
    return res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED));

  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message || "Unable to update product profile");
  }
};


exports.deleteFile = async (req, res, next) => {
  try {
    req.body.isActive = false;
    req.body.isArchived = true;
    await this.dbservice.patchObject(ProductProfileFile, req.params.id, getDocFromReq(req));
    await this.dbservice.patchObject(ProductProfile, req.params.profileId, { $pull: { files: req.params.id } });
    return res.status(StatusCodes.OK).send("Profile file deleted successfully!");
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

function getDocFromReq(req, reqType) {

  const { profile, path, extension, name, machine, fileType, awsETag, eTag, thumbnail, isReportDoc, user, isActive, isArchived, loginUser } = req.body;

  let doc = {};

  if (reqType && reqType == "new") {
    doc = new ProductProfileFile({});
  }

  if ("profile" in req.body) {
    doc.profile = profile;
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

  if ("isReportDoc" in req.body) {
    doc.isReportDoc = isReportDoc;
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