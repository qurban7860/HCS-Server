const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const mongoose = require('mongoose');
const logger = require('../../../config/logger');
const rtnMsg = require('../../../config/static/static');

const CounterController = require('../../../counter/controllers/counterController');
const articleDBService = require('../service/articleDBService');
this.dbservice = new articleDBService();

const Article = require('../models/article');
const ArticleCategory = require('../../settings/models/articleCategory');

this.fields = {};
this.query = {};
this.orderBy = { serialNumber: 1 };
this.populate = [
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

  const exists = await ArticleCategory.exists({ _id: mongoose.Types.ObjectId(req.body.category) });
  if (!exists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid category ID.');
  }

  try {
    

    const nextSerialNumber = await CounterController.getPaddedCounterSequence('article');
    req.body.serialNumber = nextSerialNumber.toString() || '';
    
    const data = {
      serialNumber: req.body.serialNumber,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description?.trim(),
      isActive: req.body.isActive ?? true,
      isArchived: req.body.isArchived ?? false
    };

    const response = await this.dbservice.postObject(new Article(data));
    res.status(StatusCodes.CREATED).json({ Article: response });
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

  const exists = await ArticleCategory.exists({ _id: mongoose.Types.ObjectId(req.body.category) });
  if (!exists) {
    return res.status(StatusCodes.BAD_REQUEST).send('Invalid category ID.');
  }

  try {
    const updates = {
      ...(req.body.title && { title: req.body.title.trim() }),
      ...(req.body.category && { category: req.body.category }),
      ...(req.body.description && { description: req.body.description.trim() }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
      ...(req.body.isArchived !== undefined && { isArchived: req.body.isArchived })
    };

    const result = await this.dbservice.patchObject(Article, req.params.id, updates);
    res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
