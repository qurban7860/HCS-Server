const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const mongoose = require('mongoose');
const logger = require('../../../config/logger');
const rtnMsg = require('../../../config/static/static');

const CounterController = require('../../../counter/controllers/counterController');
const articleFilesController = require('./articleFilesController');
const articleDBService = require('../service/articleDBService');
this.dbservice = new articleDBService();

const { Article } = require('../models');
const ArticleCategory = require('../../settings/models/articleCategory');

this.fields = {};
this.query = {};
this.orderBy = { serialNumber: 1 };
this.populate = [
  { path: 'files', select: 'name fileType extension thumbnail eTag path' },
  { path: 'category', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

exports.getArticle = async (req, res) => {
  try {
    const response = await this.dbservice.getObjectById(Article, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getArticles = async (req, res) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    const response = await this.dbservice.getObjectList(req, Article, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const result = await this.dbservice.deleteObject(Article, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  const isCategoryExists = await this.dbservice.isExists(ArticleCategory, { _id: mongoose.Types.ObjectId(req.body.category) });

  if (!isCategoryExists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid category ID.');
  }

  const exists = await this.dbservice.isExists(Article, { title: req.body.title });
  if (exists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Article title already exists.');
  }

  try {

    const articleNumber = await CounterController.getPaddedCounterSequence('article');
    req.body.articleNo = articleNumber.toString() || '';
    const response = await this.dbservice.postObject(getArticleFromReq(req, "new"));
    req.params.articleId = response._id;
    await articleFilesController.saveArticleFiles(req)
    res.status(StatusCodes.CREATED).json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  if ("category" in req.body) {
    const isCategoryExists = await this.dbservice.isExists(ArticleCategory, { _id: mongoose.Types.ObjectId(req.body.category) });
    if (!isCategoryExists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Invalid category ID.');
    }
  }

  if ("title" in req.body) {
    const exists = await this.dbservice.isExists(Article, { title: req.body.title, _id: { $ne: req.params.id } });
    if (exists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Article title already exists.');
    }
  }

  if (req.body?.isArchived) {
    req.body.isActive = false;
  }

  try {
    const result = await this.dbservice.patchObject(Article, req.params.id, getArticleFromReq(req, "update"));
    res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function getArticleFromReq(req, reqType) {
  const { articleNo, title, description, category, status, customerAccess, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Article({});
  }
  if ("articleNo" in req.body) {
    doc.articleNo = articleNo;
  }
  if ("title" in req.body) {
    doc.title = title;
  }
  if ("description" in req.body) {
    doc.description = description.trim();
  }

  if ("category" in req.body) {
    doc.category = category;
  }

  if ("status" in req.body) {
    doc.status = status;
  }

  if ("customerAccess" in req.body) {
    doc.customerAccess = customerAccess;
  }

  if ("isActive" in req.body) {
    doc.isActive = isActive;
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