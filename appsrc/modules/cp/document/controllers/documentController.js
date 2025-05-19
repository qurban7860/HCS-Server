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
const dbservice = new documentDBService();

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



exports.getDocument = async (req, res, next) => {
  try {

    let document_ = await dbservice.getObject(Document, this.fields, req.params.id, this.populate);
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


  let listCustomers;
  let listProducts;
  let isVersionNeeded = true;
  let isDrawing = false;

  try {
    this.query = req.query != "undefined" ? req.query : {};
    if (this.query.orderBy) {
      this.orderBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    if (this.query && (this.query.isVersionNeeded == false || this.query.isVersionNeeded == 'false')) {
      isVersionNeeded = false;
      delete this.query.isVersionNeeded;
    }

    if (this.query.searchKey && this.query.searchColumn && !this.query.forDrawing) {
      const regexCondition = { $regex: escapeRegExp(this.query.searchKey), $options: "i" };
      if (this.query.searchColumn === "machine.serialNo") {
        const machineIds = await Product.find({
          "serialNo": regexCondition, isArchived: false
        }, "_id").lean();
        this.query.machine = { $in: machineIds };
      } else if (this.query.searchColumn.includes(".")) {
        const [parentField, childField] = this.query.searchColumn.split(".");
        this.query[parentField] = {
          [childField]: regexCondition
        };
      } else {
        this.query[this.query.searchColumn] = regexCondition;
      }

      delete this.query.searchKey;
      delete this.query.searchColumn;
    }

    let basicInfo = false;

    if (this.query && (this.query.basic == true || this.query.basic == 'true')) {
      basicInfo = true;
      delete this.query.basic;
    }

    if (this.query.forCustomer || this.query.forMachine || this.query.forDrawing) {
      if (this.query.forDrawing)
        if (this.query.searchColumn == "machine.serialNo") {
          const regexCondition = { $regex: escapeRegExp(this.query.searchKey), $options: "i" };
          const machineIds = await Product.find({ "serialNo": regexCondition, isArchived: false }, "_id").lean();
          // console.log("machineIds : ", machineIds)
          const documentIds = await ProductDrawing.find({ "machine": { $in: machineIds?.map(m => m?._id) }, isArchived: false }, "document").lean();
          // console.log("documentIds : ", documentIds)
          this.query._id = { $in: documentIds?.map(d => d?.document) };
          delete this.query.searchKey;
          delete this.query.searchColumn;
        }
      isDrawing = true;
      let query;
      if (this.query.forCustomer && this.query.forMachine) {
        query = { $or: [{ customer: true }, { machine: true }] };
        if (!listCustomers || listCustomers.length == 0) {
          this.query.$or = [
            { customer: { '$exists': true } },
            { machine: { '$exists': true } }
          ];
        }
      }

      else if (this.query.forCustomer)
        query = { customer: true };
      else if (this.query.forMachine)
        query = { machine: true };
      else if (this.query.forDrawing)
        query = { drawing: true };
      if (query) {
        let docCats = await DocumentCategory.find({ ...query, ...(this.query.docCategory ? { _id: this.query.docCategory, isActive: true, isArchived: false } : { isActive: true, isArchived: false }) }).select('_id').lean();

        if (Array.isArray(docCats) && docCats.length > 0) {
          let docCatIds = docCats.map((dc) => dc._id.toString());
          this.query.docCategory = { $in: docCatIds };
          delete this.query.forCustomer;
          delete this.query.forMachine;
          delete this.query.forDrawing;
        }
      }
    }

    if (this.query.isArchived == 'false')
      this.query.isArchived = false;

    if (this.query.isArchived == 'true')
      this.query.isArchived = true;


    if (this.query.isActive == 'true')
      this.query.isActive = true;

    if (this.query.isActive == 'false')
      this.query.isActive = false;

    this.populate = [
      { path: 'createdBy', select: 'name' },
      { path: 'updatedBy', select: 'name' },
      { path: 'docType', select: 'name' },
      { path: 'previousDocType', select: 'name' },
      { path: 'docCategory', select: 'name drawing' },
      { path: 'customer', select: 'name' },
      { path: 'machine', select: 'name serialNo' }
    ];

    let andString = [];
    if (listCustomers && listCustomers.length > 0) {
      andString.push({ customer: { $in: listCustomers } });
    }

    if (listProducts && listProducts.length > 0) {
      andString.push({ machine: { $in: listProducts } });
    }
    if (andString && andString.length > 0) {
      if (!this.query.$or || !this.query.$or.length == 0) {
        this.query.$or = [];
      }
      this.query.$or.push(...andString);
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

    // if (this.query.machine) {
    //   let docMachines = await Product.find(this.query.machine).select('_id').lean();
    //   if (Array.isArray(docMachines) && docMachines.length > 0) {
    //     let docMachinesIds = docMachines.map((dc) => dc._id.toString());
    //     this.query.machine = { $in: [this.query.machine] };
    //   } else delete this.query.machine;
    // }

    // let documents = await dbservice.getObjectList(req, Document, this.fields, this.query, this.orderBy, this.populate);
    // let docTypes_ = await DocumentType.find({
    //   ...(this.query.docType ? this.query.docType : { isPrimaryDrawing: true })
    // }).select('_id').lean();

    // if (Array.isArray(docTypes_) && docTypes_.length > 0) {
    //   let docTypeIds = docTypes_.map((dc) => dc._id.toString());
    //   this.query.docType = { $in: docTypeIds };
    // } else {
    //   delete this.query.docType;
    // }
    let docTypeIds = this.query.docType ? [this.query.docType] : [];
    if (docTypeIds.length > 0) {
      this.query.docType = { $in: docTypeIds };
    } else {
      delete this.query.docType;
    }

    let documents;

    if (this.query.docType) {
      // Single query for when when docType is specified
      documents = await Document.find(this.query).populate(this.populate).sort({ createdAt: -1 }).select(this.fields).lean();
    } else {
      // This section is done to get all the documents of type assembly drawing at the front
      let assemblyDrawings = await Document.find(this.query).populate(this.populate).sort({ createdAt: -1 }).select(this.fields).lean();

      let otherDocuments = await Document.find({
        ...this.query,
        docType: { $nin: [...docTypeIds] },
      })
        .populate(this.populate)
        .sort({ createdAt: -1 })
        .select(this.fields)
        .lean();

      // Combine and remove duplicates for all results.
      documents = [...new Map([...assemblyDrawings, ...otherDocuments].map((doc) => [doc._id.toString(), doc])).values()];
    }

    if (req.body.page || req.body.page === 0) {
      let pageSize = parseInt(req.body.pageSize) || 100; // Number of documents per page
      const totalPages = Math.ceil(documents.length / pageSize);
      const totalCount = documents.length;
      let page = parseInt(req.body.page) || 0; // Current page number
      let skip = req.body.page * pageSize;
      documents = documents.slice(skip, skip + pageSize);

      documents = {
        data: documents,
        ...(req.body.page && {
          totalPages: totalPages,
          currentPage: page,
          pageSize: pageSize,
          totalCount: totalCount
        })
      };
    }

    const documents__ = documents;
    documents = documents.data;
    if (documents && Array.isArray(documents) && documents.length > 0) {
      documents = JSON.parse(JSON.stringify(documents));

      if (isVersionNeeded) {
        let documentIndex = 0;
        for (let document_ of documents) {

          if (document_ && Array.isArray(document_.documentVersions) && document_.documentVersions.length > 0) {

            document_ = JSON.parse(JSON.stringify(document_));

            let documentVersionQuery = { _id: { $in: document_.documentVersions }, isArchived: false };
            let documentVersions = [];
            if (basicInfo === false) {
              documentVersions = await DocumentVersion.find(documentVersionQuery).select('files versionNo description').sort({ createdAt: -1 });
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
            }
            else {
              let documentVersion = await DocumentVersion.findOne(documentVersionQuery).select('versionNo description').sort({ createdAt: -1 });
              documentVersions = [documentVersion]
            }

            if (isDrawing) {
              document_.productDrawings = await ProductDrawing.find({ document: document_._id, isActive: true, isArchived: false }, { machine: 1, serialNo: 1 }).populate({
                path: "machine",
                select: "serialNo",
              });
              document_.productDrawings.serialNumbers = document_.productDrawings.map((item) => item?.machine?.serialNo).join(", ");
            }
            document_.documentVersions = documentVersions;
          }
          documents[documentIndex] = document_;
          documentIndex++;
        }
      }
    }

    documents__.data = documents;
    res.json(documents__);
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}