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

exports.getArticleCategory = async (req, res) => {
  try {
    const response = await this.dbservice.getObjectById(ArticleCategory, this.fields, req.params.id);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getArticleCategories = async (req, res) => {
  try {
    this.query = req.query !== "undefined" ? req.query : {};
    const response = await this.dbservice.getObjectList(req, ArticleCategory, this.fields, this.query, this.orderBy);
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

    const data = {
      name: req.body.name,
      description: req.body.description?.trim(),
      isActive: req.body.isActive ?? true,
      isArchived: req.body.isArchived ?? false
    };

    const response = await this.dbservice.postObject(new ArticleCategory(data));
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
    const updates = {
      ...(req.body.name && { name: req.body.name.trim() }),
      ...(req.body.description && { description: req.body.description.trim() }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
      ...(req.body.isArchived !== undefined && { isArchived: req.body.isArchived })
    };

    const result = await this.dbservice.patchObject(ArticleCategory, req.params.id, updates);
    res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
