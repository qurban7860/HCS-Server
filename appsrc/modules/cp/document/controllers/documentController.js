const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const path = require('path');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const fs = require('fs');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const awsService = require('../../../../../appsrc/base/aws');

const _ = require('lodash');
const HttpError = require('../../../config/models/http-error');
const logger = require('../../../config/logger');
let rtnMsg = require('../../../config/static/static')

let documentDBService = require('../../../documents/service/documentDBService')
this.dbservice = new documentDBService();

const { Document, DocumentType, DocumentCategory, DocumentFile, DocumentVersion, DocumentAuditLog } = require('../../../documents/models');

const { Customer, CustomerSite } = require('../../../crm/models');
const { Product, MachineModel, ProductDrawing } = require('../../../products/models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'docType', select: 'name' },
  { path: 'previousDocType', select: 'name' },
  { path: 'docCategory', select: 'name drawing' },
  { path: 'machineModel', select: 'name' },
  { path: 'customer', select: 'name' },
  { path: 'machine', select: 'name serialNo' },
  { path: 'site', select: 'name' },
];

this.populateHistory = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.documentPopolate = this.populate

exports.getDocument = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id
    this.query.customerAccess = true
    this.query.isArchived = false
    let document_ = await this.dbservice.getObject(Document, this.query, this.populate);
    if (document_ && Array.isArray(document_.documentVersions) && document_.documentVersions.length > 0) {

      document_ = JSON.parse(JSON.stringify(document_));

      let documentVersionQuery = { _id: { $in: document_.documentVersions }, isArchived: false };
      let documentVersions = [];
      let historical = req.query.historical;

      if (historical)
        documentVersions = await DocumentVersion.find(documentVersionQuery).select('files versionNo description updatedBy createdBy updatedIP createdIP createdAt updatedAt').sort({ createdAt: -1 }).populate(this.populateHistory);
      else
        documentVersions = await DocumentVersion.find(documentVersionQuery).select('files versionNo description updatedBy createdBy updatedIP createdIP createdAt updatedAt').sort({ createdAt: -1 }).populate(this.populateHistory).limit(1);

      if (Array.isArray(documentVersions) && documentVersions.length > 0) {
        documentVersions = JSON.parse(JSON.stringify(documentVersions));


        for (let documentVersion of documentVersions) {
          if (Array.isArray(documentVersion.files) && documentVersion.files.length > 0) {
            let documentFileQuery = { _id: { $in: documentVersion.files }, isArchived: false };
            let documentFiles = await DocumentFile.find(documentFileQuery).select('name displayName path extension fileType thumbnail');
            documentVersion.files = documentFiles;
          }
        }
      }

      if (document_?.docCategory?.drawing) {
        document_.productDrawings = await ProductDrawing.find({ document: document_._id, isActive: true, isArchived: false }, { machine: 1 }).populate({ path: 'machine', select: 'name serialNo' });
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
    this.query.customerAccess = true;
    const docCategoryQuery = { isArchived: false, isActive: true }
    if (typeof this.query.customerAccess === 'boolean') {
      docCategoryQuery.customerAccess = this.query.customerAccess;
    }
    if (typeof this.query.forCustomer === 'boolean') {
      docCategoryQuery.customer = this.query.forCustomer;
      delete this.query.forCustomer
    } else if (typeof this.query.forMachine === 'boolean') {
      docCategoryQuery.machine = this.query.forMachine;
      delete this.query.forMachine
    } else if (typeof this.query.forDrawing === 'boolean') {
      docCategoryQuery.drawing = this.query.forDrawing;
      delete this.query.forDrawing
    }

    const docCategories = await this.dbservice.getObjectList(null, DocumentCategory, this.fields, docCategoryQuery);
    this.query.docCategory = { $in: docCategories?.map((dc) => dc?._id.toString()) }
    // const docTypeQuery = { customerAccess: true, isArchived: false, isActive: true, }
    // const docTypes = await this.dbservice.getObjectList(null, DocumentType, this.fields, docTypeQuery);
    // this.query.docType = { $in: docTypes?.map((dt) => dt?._id.toString()) }
    if (
      (Array.isArray(docCategories) && !docCategories?.length > 0)
      // ||  (Array.isArray(docTypes) && !docTypes?.length > 0)
    ) {
      if (req.body?.page) {
        return res.json({
          data: [],
          totalPages: 0,
          currentPage: 0,
          pageSize: req.body.pageSize,
          totalCount: 0
        })
      }
      return res.json([]);
    }

    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    let basicInfo = false;

    if (this.query && (this.query.basic == true || this.query.basic == 'true')) {
      basicInfo = true;
      delete this.query.basic;
    }

    const orCondition = [];

    if (this.query?.searchString) {
      const regexCondition = { $regex: escapeRegExp(this.query.searchString), $options: 'i' };
      orCondition.push({ name: regexCondition });
      orCondition.push({ displayName: regexCondition });
      orCondition.push({ referenceNumber: regexCondition });
      orCondition.push({ stockNumber: regexCondition });
      delete this.query.searchString;

      if (orCondition?.length > 0) {
        this.query.$or = orCondition;
      }
    }
    const response = await this.dbservice.getObjectList(req, Document, this.fields, this.query, this.orderBy, this.populate);

    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}