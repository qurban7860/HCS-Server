const { StatusCodes, getReasonPhrase } = require('http-status-codes');

const logger = require('../../../config/logger');

let productDBService = require('../../../products/service/productDBService')
this.dbservice = new productDBService();

const { ProductDrawing } = require('../../../products/models');

const { Document, DocumentType, DocumentCategory } = require('../../../documents/models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { 'document.displayName': 1 };
this.populate = [
  { path: 'document', select: 'displayName referenceNumber stockNumber isActive isArchived customerAccess' },
  { path: 'documentCategory', select: 'name' },
  { path: 'documentType', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getProductDrawing = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id
    this.query.isArchived = false
    this.query.customerAccess = true
    let response = await dbservice.getObject(Document, this.query, this.populate);
    if (response) {
      res.json(response);
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getProductDrawings = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query.isArchived = false

    const docCategoryQuery = { customerAccess: true, isArchived: false, isActive: true }
    if (this.query.forCustomer) {
      docCategoryQuery.customer = true;
      delete this.query.forCustomer
    } else if (this.query.forMachine) {
      docCategoryQuery.machine = true;
      delete this.query.forMachine
    } else if (this.query.forDrawing) {
      docCategoryQuery.drawing = true;
      delete this.query.forDrawing
    }

    const docCategories = await this.dbservice.getObjectList(null, DocumentCategory, this.fields, docCategoryQuery);
    this.query.documentCategory = { $in: docCategories?.map((dc) => dc?._id.toString()) }
    const docTypeQuery = { customerAccess: true, isArchived: false, isActive: true }
    const docTypes = await this.dbservice.getObjectList(null, DocumentType, this.fields, docTypeQuery);
    this.query.documentType = { $in: docTypes?.map((dt) => dt?._id.toString()) }
    if (
      (Array.isArray(docCategories) && !docCategories?.length > 0) ||
      (Array.isArray(docTypes) && !docTypes?.length > 0)
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

    let response = await this.dbservice.getObjectList(req, ProductDrawing, this.fields, this.query, this.orderBy, this.populate);
    response = {
      ...response,
      data: response?.data?.filter(d => d?.document.customerAccess)
    }
    // if (response?.length > 0 && docTypes?.length > 0) {
    //   response.sort((a, b) => {
    //     const indexA = docTypes.findIndex(doc => doc._id.toString() === a.documentType._id.toString());
    //     const indexB = docTypes.findIndex(doc => doc._id.toString() === b.documentType._id.toString());

    //     if (indexA !== -1 && indexB === -1) {
    //       return -1; // Move a before b
    //     } else if (indexA === -1 && indexB !== -1) {
    //       return 1; // Move b before a
    //     } else {
    //       return 0; // Keep the order unchanged
    //     }
    //   });
    // }
    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

