const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../../config/logger');
let { processFile } = require('../../../files/utils')
let { allowedMimeTypes } = require('../../../files/constant')
let articleDBService = require('../service/articleDBService')
this.dbservice = new articleDBService();
const awsService = require('../../../../base/aws');
const _ = require('lodash');
const { Config } = require('../../../config/models');
const { Article, ArticleFile } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];


exports.getArticleFile = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query.article = req.params.articleId;
    this.query._id = req.params.id;

    const file = await this.dbservice.getObject(ArticleFile, this.query, this.populate);

    if (!file?._id) {
      return res.status(StatusCodes.BAD_REQUEST).send('File not found!');
    }

    if (!file?.path) {
      return res.status(StatusCodes.BAD_REQUEST).send('Invalid file path!');
    }

    const data = await awsService.fetchAWSFileInfo(file._id, file.path);

    const isImage = file?.fileType && allowedMimeTypes?.includes(file?.fileType);
    const regex = new RegExp("^OPTIMIZE_IMAGE_ON_DOWNLOAD$", "i");
    let configObject = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    configObject = configObject && configObject?.value?.trim()?.toLowerCase() == 'true' ? true : false;
    const fileSizeInMegabytes = ((data.ContentLength / 1024) / 1024);

    if (isImage && configObject && fileSizeInMegabytes > 2) {
      const fileBase64 = await awsService.processAWSFile(data);
      return res.status(StatusCodes.ACCEPTED).send(fileBase64);
    }

    return res.status(StatusCodes.ACCEPTED).send(data.Body);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.getArticleFiles = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query.article = req.params.articleId
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }
    let result = await this.dbservice.getObjectList(req, ArticleFile, this.fields, this.query, this.orderBy, this.populate);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

const saveArticleFiles = async (req) => {
  try {
    if (!req?.files?.images?.length) {
      return [];
    }
    const files = req.files.images;

    const fileProcessingPromises = files?.map(async (file) => {
      if (!file || !file.originalname) {
        logger.error('File not found!');
        throw new Error('File not found!');
      }

      const processedFile = await processFile(file, req.body?.loginUser?.userId, process.env.S3_KNOWLEDGE_BASE_FOLDER_NAME);

      req.body = {
        loginUser: req.body.loginUser,
        path: processedFile.s3FilePath,
        fileType: processedFile.type,
        extension: processedFile.fileExt,
        awsETag: processedFile.awsETag,
        eTag: processedFile.eTag,
        article: req.params.articleId,
        name: processedFile.name,
        thumbnail: processedFile.base64thumbNailData || undefined,
      };

      let articleFile = await getDocFromReq(req, 'new');

      articleFile = await this.dbservice.postObject(articleFile);
      let result = { ...articleFile?._doc }
      if (result?.fileType?.startsWith('video')) {
        result.src = await awsService.generateDownloadURL({ key: result.path, name: result.name, extension: result.extension });
        delete result.path;
      }

      return result;
    });

    const savedFiles = await Promise.all(fileProcessingPromises);
    if (Array.isArray(savedFiles) && savedFiles?.length > 0) {
      const filesIds = savedFiles?.map(sf => sf?._id)
      const isUpdated = await this.dbservice.patchObject(Article, req.params.articleId, { $push: { files: { $each: filesIds } } });
    }
    return savedFiles;
  } catch (error) {
    throw error
  }
}

exports.saveArticleFiles = saveArticleFiles;

exports.postArticleFiles = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(new Error(errors));
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
    req.body.article = req.params?.articleId;
    const files = await saveArticleFiles(req)
    return res.status(StatusCodes.OK).json(files);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

exports.deleteArticleFile = async (req, res, next) => {
  try {
    req.body.isActive = false;
    req.body.isArchived = true;
    if (!mongoose.Types.ObjectId(req.params.id)) {
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid File Id!");
    }
    await this.dbservice.patchObject(ArticleFile, req.params.id, getDocFromReq(req));
    await this.dbservice.patchObject(Article, req.params.articleId, { $pull: { files: req.params.id } });
    return res.status(StatusCodes.OK).send("Article file deleted successfully!");
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.BAD_REQUEST).send(error?.message);
  }
};

function getDocFromReq(req, reqType) {
  const { loginUser } = req.body;
  const doc = reqType === "new" ? new ArticleFile({}) : {};
  const allowedFields = ["article", "name", "path", "fileType", "extension", "thumbnail", "awsETag", "eTag", "isActive", "isArchived"];

  allowedFields.forEach((field) => {
    if (field in req.body) {
      doc[field] = req.body[field];
    }
  });

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