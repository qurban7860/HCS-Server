const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../../config/logger');
let productDBService = require('../../../products/service/productDBService')
this.dbservice = new productDBService();
const { ProductDrawing } = require('../../../products/models');
const { Document, DocumentFile, DocumentVersion, DocumentType, DocumentCategory } = require('../../../documents/models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
const { documentPopolate } = require('./documentController');

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
    let drawing = await this.dbservice.getObject(ProductDrawing, this.query, this.populate);
    if (!drawing?.document?._id || !drawing?.document?.customerAccess) {
      return res.json({});
    }
    let document_ = await this.dbservice.getObject(Document, { _id: drawing?.document?._id, isArchived: false }, documentPopolate);
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
    return res.json(document_);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getProductDrawings = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query.isArchived = false

    const docCategoryQuery = { isArchived: false, isActive: true }

    if (typeof this.query.customerAccess === 'boolean') {
      docCategoryQuery.customerAccess = this.query.customerAccess;
    }

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

    // non primary drawing document types

    // const docTypeQuery = { isArchived: false, isActive: true, }
    // if (typeof this.query.customerAccess === 'boolean') {
    //   docTypeQuery.customerAccess = this.query.customerAccess;
    // }
    // const docTypes = await this.dbservice.getObjectList(null, DocumentType, this.fields, docTypeQuery);
    // this.query.docType = { $in: docTypes?.map((dt) => dt?._id.toString()) }

    // primary drawing document types
    // const primaryDocTypeQuery = { customerAccess: true, isArchived: false, isActive: true, isPrimaryDrawing: true }
    // const primaryDocTypes = await this.dbservice.getObjectList(null, DocumentType, this.fields, primaryDocTypeQuery);
    // this.query.documentType = { $in: docTypes?.map((dt) => dt?._id.toString()) }

    if (
      (Array.isArray(docCategories) && !docCategories?.length > 0)
      // || (Array.isArray(docTypes) && !docTypes?.length > 0)
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
    response.totalCount = response.data.length;
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

