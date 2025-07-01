const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../../config/logger');
let productDBService = require('../../../products/service/productDBService')
this.dbservice = new productDBService();
const mongoose = require('mongoose')
const { ProductDrawing } = require('../../../products/models');
const { Document, DocumentFile, DocumentVersion, DocumentType, DocumentCategory } = require('../../../documents/models');
this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
const { documentPopolate } = require('./documentController');

this.fields = {};
this.query = {};
this.orderBy = { 'document.displayName': 1 };
this.populate = [
  { path: 'document', select: 'displayName referenceNumber stockNumber isActive isArchived customerAccess' },
  { path: 'documentCategory', select: 'name customerAccess' },
  { path: 'documentType', select: 'name customerAccess' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getProductDrawing = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : {};
    this.query._id = req.params.id
    this.query.isArchived = false
    let drawing = await this.dbservice.getObject(ProductDrawing, this.query, this.populate);
    if (!drawing?.document?._id && !drawing?.document?.customerAccess && !drawing?.documentCategory?.customerAccess && !drawing?.documentType?.customerAccess) {
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

    const drawingsAggregate = [
      {
        $lookup: {
          from: "DocumentTypes",
          localField: "documentType",
          foreignField: "_id",
          as: "documentType"
        }
      },
      {
        $unwind: {
          path: "$documentType",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "DocumentCategories",
          localField: "documentCategory",
          foreignField: "_id",
          as: "documentCategory"
        }
      },
      {
        $unwind: {
          path: "$documentCategory",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "Documents",
          localField: "document",
          foreignField: "_id",
          as: "document"
        }
      },
      {
        $unwind: {
          path: "$document",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "SecurityUsers",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "SecurityUsers",
          localField: "updatedBy",
          foreignField: "_id",
          as: "updatedBy"
        }
      },
      {
        $unwind: {
          path: "$updatedBy",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $match: {
          $and: [
            { isActive: true },
            { isArchived: false },
            { machine: mongoose.Types.ObjectId(req.query.machine) },
            {
              $or: [
                { "document.customerAccess": true },
                { "documentType.customerAccess": true },
                { "documentCategory.customerAccess": true }
              ]
            }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          machine: 1,
          "document.customerAccess": 1,
          "document.displayName": 1,
          "document.referenceNumber": 1,
          "document.stockNumber": 1,
          "document.isActive": 1,
          "document.isArchived": 1,
          "documentType._id": 1,
          "documentType.name": 1,
          "documentType.customerAccess": 1,
          "documentCategory._id": 1,
          "documentCategory.name": 1,
          "documentCategory.customerAccess": 1,
          "createdBy._id": 1,
          "createdBy.name": 1,
          "updatedBy._id": 1,
          "updatedBy.name": 1,
        }
      }
    ]


    let response = await this.dbservice.getObjectListWithAggregate(ProductDrawing, drawingsAggregate);
    console.log({ response })

    response = {
      data: response,
      totalPages: Math.ceil(response.length / req.body?.pageSize),
      currentPage: req.body?.page,
      pageSize: req.body?.pageSize,
      totalCount: response.length
    };

    return res.json(response);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

