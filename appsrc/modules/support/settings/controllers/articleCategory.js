const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const mongoose = require('mongoose');
const logger = require('../../../config/logger');
const rtnMsg = require('../../../config/static/static');

const articleCategoryDBService = require('../service/articleCategoryDBService');
this.dbservice = new articleCategoryDBService();

const ArticleCategory = require('../models/articleCategory');
const Article = require('../../knowledgeBase/models/article');

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

exports.getArticleCategory = async (req, res) => {
  try {
    const response = await this.dbservice.getObjectById(ArticleCategory, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getArticleCategories = async (req, res) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    const response = await this.dbservice.getObjectList(req, ArticleCategory, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.deleteArticleCategory = async (req, res) => {
  try {
    const articleCount = await Article.countDocuments({ category: req.params.id });

    if (articleCount > 0) {
      return res.status(StatusCodes.BAD_REQUEST).send('Category cannot be deleted as it is assigned to one or more articles.');
    }
    
    const result = await this.dbservice.deleteObject(ArticleCategory, req.params.id);
    res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.postArticleCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  try {

    const exists = await this.dbservice.isExists(ArticleCategory, { name: req.body.name });
    if (exists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Category name already exists.');
    }
        
    const response = await this.dbservice.postObject(getArticleCategoryFromReq(req, "new"));
    res.status(StatusCodes.CREATED).json({ ArticleCategory: response });
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.patchArticleCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  try {

    const exists = await this.dbservice.isExists(ArticleCategory, { name: req.body.name, _id: { $ne: req.params.id } });
    if (exists) {
      return res.status(StatusCodes.BAD_REQUEST).send('Category name already exists.');
    }

    const result = await this.dbservice.patchObject(ArticleCategory, req.params.id, getArticleCategoryFromReq(req, "update"));
    res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function getArticleCategoryFromReq(req, reqType) {
  const { name, description, isActive, isArchived, loginUser } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new ArticleCategory({});
  }
  if ("name" in req.body) {
    doc.name = name.trim();
  }
  if ("description" in req.body) {
    doc.description = description.trim();
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