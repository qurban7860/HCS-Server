const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const _ = require('lodash');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let documentDBService = require('../service/documentDBService')
this.dbservice = new documentDBService();

const { Document, DocumentType, DocumentCategory } = require('../models');
const { ProductDrawing } = require('../../products/models');
const ObjectId = require('mongoose').Types.ObjectId;

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'docCategory', select: 'name customer machine drawing isDefault' },

];



exports.getDocumentType = async (req, res, next) => {
  try {
    const response = await this.dbservice.getObjectById(DocumentType, this.fields, req.params.id, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentTypes = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};

    let machine = req.query.machine === 'true' || req.query.machine === true ? true : false;
    let customer = req.query.customer === 'true' || req.query.customer === true ? true : false;
    let drawing = req.query.drawing === 'true' || req.query.drawing === true ? true : false;

    let QueryString = [];
    if (machine || customer || drawing) {
      delete req.query.machine;
      delete req.query.customer;
      delete req.query.drawing;

      if (machine) QueryString.push({ machine: true });
      if (customer) QueryString.push({ customer: true });
      if (drawing) QueryString.push({ drawing: true });
      let CategoryQuery = {};
      if (QueryString) {
        CategoryQuery.$and = QueryString;
      }
      if (req.query.docCategory) CategoryQuery._id = req.query.docCategory;
      let documentCategoryObject = await DocumentCategory.find(CategoryQuery).select('_id customer machine drawing').lean();
      if (documentCategoryObject) this.query.docCategory = { $in: documentCategoryObject }
    }

    const response = await this.dbservice.getObjectList(req, DocumentType, this.fields, this.query, this.orderBy, this.populate);
    res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getDocumentTypeFiles = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const queryString = { documentType: req.params.id };
      const response = await this.dbservice.getObjectList(req, Document, this.fields, { docType: req.params.id }, this.orderBy, this.populate);
      res.json(response);
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  }
};

exports.deleteDocumentType = async (req, res, next) => {
  const response = await this.dbservice.getObject(Document, { docType: req.params.id }, "");
  if (response === null) {
    try {
      const result = await this.dbservice.deleteObject(DocumentType, req.params.id);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  } else {
    res.status(StatusCodes.CONFLICT).send(rtnMsg.recordDelMessage(StatusCodes.CONFLICT, null));
  }
};


exports.postDocumentType = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (req.body.isDefault === 'true' || req.body.isDefault === true && ObjectId.isValid(req.body.docCategory)) {
        let documentCategoryObject = await DocumentCategory.findOne({ _id: req.body.docCategory }).select('_id customer machine drawing').lean();
        if (documentCategoryObject) {
          let updateDefaultString = [];
          let queryString__ = {};
          if (documentCategoryObject.machine) updateDefaultString.push({ machine: true });
          if (documentCategoryObject.customer) updateDefaultString.push({ customer: true });
          if (documentCategoryObject.drawing) updateDefaultString.push({ drawing: true });
          if (!documentCategoryObject.machine) queryString__.machine = false;
          if (!documentCategoryObject.customer) queryString__.customer = false;
          if (!documentCategoryObject.drawing) queryString__.drawing = false;

          if (updateDefaultString.length > 0) {
            queryString__.$or = updateDefaultString;
          }
          let docxCategories = await DocumentCategory.find(queryString__).select('_id').lean();

          await DocumentType.updateMany({ docCategory: { $in: docxCategories } }, { $set: { isDefault: false } }, function (err, result) {
            if (err) console.error(err);
            else console.log(result);
          });
        }
      }
      const response = await this.dbservice.postObject(getDocumentFromReq(req, 'new'));
      res.status(StatusCodes.CREATED).json({ DocumentType: response });
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

exports.patchDocumentType = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (req.body?.isArchived) {
        const docType = await this.dbservice.getObject(DocumentType, { _id: req.params.id }, "");
        if (docType?.isPrimaryDrawing) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'Primary drawing type can not be archived!'));
        }
        const doc = await this.dbservice.getObject(Document, { docType: req.params.id, isArchived: false }, "");
        if (doc?._id) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'Document type used in document can not be archived!'));
        }
        const drawing = await this.dbservice.getObject(ProductDrawing, { documentType: req.params.id, isArchived: false }, "");
        if (drawing?._id) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'Document type used in drawing can not be archived!'));
        }
      }
      if (req.body.isDefault === 'true' || req.body.isDefault === true) {
        let documentCategoryObject = await DocumentCategory.findOne({ _id: req.body.docCategory }).select('_id customer machine drawing').lean();
        if (documentCategoryObject) {
          let updateDefaultString = [];
          let queryString__ = {};
          if (documentCategoryObject.machine) updateDefaultString.push({ machine: true });
          if (documentCategoryObject.customer) updateDefaultString.push({ customer: true });
          if (documentCategoryObject.drawing) updateDefaultString.push({ drawing: true });
          if (!documentCategoryObject.machine) queryString__.machine = false;
          if (!documentCategoryObject.customer) queryString__.customer = false;
          if (!documentCategoryObject.drawing) queryString__.drawing = false;

          if (updateDefaultString.length > 0) {
            queryString__.$or = updateDefaultString;
          }
          let docxCategories = await DocumentCategory.find(queryString__).select('_id').lean();

          await DocumentType.updateMany({ docCategory: { $in: docxCategories } }, { $set: { isDefault: false } }, function (err, result) {
            if (err) console.error(err);
            else console.log(result);
          });
        }
      }
      const result = await this.dbservice.patchObject(DocumentType, req.params.id, getDocumentFromReq(req));
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};


exports.mergeDocumentType = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      console.log('req.params.id  : ', req.params.id)
      if (Array.isArray(req.body.docTypes) && req.body.docTypes?.length > 0 && req.params.id) {
        await Document.updateMany(
          { docType: { $in: req.body.docTypes } },
          [{ $set: { previousDocType: '$docType', docType: req.params.id } }],
          function (err, result) {
            if (err) {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Documents type update failed!');
            } else {
              console.log('Documents updates : ', result)
            }
          }
        );

        await DocumentType.updateMany({ _id: { $in: req.body.docTypes } }, { $set: { isActive: false, isArchived: true } },
          function (err, result) {
            if (err) {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Archive merge types failed!');
            } else {
              console.log('Doctypes updated : ', result)
            }
          });
      } else {
        res.status(StatusCodes.BAD_REQUEST).send("Please provide document types to update");
      }
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED));
    } catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

function getDocumentFromReq(req, reqType) {
  const { name, description, customerAccess, isPrimaryDrawing, isDefault, isActive, isArchived, loginUser, docCategory } = req.body;

  let doc = {};
  if (reqType && reqType == "new") {
    doc = new DocumentType({});
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("description" in req.body) {
    doc.description = description;
  }

  if ("customerAccess" in req.body) {
    doc.customerAccess = customerAccess;
  }

  if ("isPrimaryDrawing" in req.body) {
    doc.isPrimaryDrawing = isPrimaryDrawing;
  }

  if ("isDefault" in req.body) {
    doc.isDefault = isDefault;
  }

  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if ("docCategory" in req.body) {
    doc.docCategory = docCategory;
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