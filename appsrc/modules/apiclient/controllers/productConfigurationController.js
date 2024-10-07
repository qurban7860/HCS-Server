const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');

let apiClientDBService = require('../service/apiClientDBService')
this.dbservice = new apiClientDBService();

const { Product, ProductTechParam } = require('../../products/models');

const { ProductConfiguration } = require('../models');



const apiLogController = require('../../apiclient/controllers/apiLogController');

const productTechParamValueController = require('../../products/controllers/productTechParamValueController');

const ObjectId = require('mongoose').Types.ObjectId;

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
//this.populate = 'category';
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};


exports.getProductConfiguration = async (req, res, next) => {
  this.dbservice.getObjectById(ProductConfiguration, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      response.configuration = replaceDotsWithSlashes(response.configuration);
      res.json(response);
    }
  }
};

exports.getProductConfigurations = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { createdAt: -1 };
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  this.dbservice.getObjectList(req, ProductConfiguration, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProductConfiguration = async (req, res, next) => {
  this.dbservice.deleteObject(ProductConfiguration, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductConfiguration = async (req, res, next) => {
  const start = Date.now();
  const errors = validationResult(req);

  req.body.apiType = "INI";

  req.body.response = "APPROVED";
  const roleAPIFound = true;
  // const roleAPIFound = req.body.loginUser.roleTypes.filter(type => type === 'APIAccess'); if(roleAPIFound) {req.body.response = "APPROVED"} else {req.body.response = "DENIED"}; 

  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    if (ObjectId.isValid(req.body.inputGUID) && req.body.inputSerialNo) {
      const query__ = { _id: req.body.inputGUID, serialNo: (String(req.body.inputSerialNo).trim()) };
      let productObject = await Product.findOne(query__).select('_id');
      if (productObject && !_.isEmpty(productObject)) {
        req.body.machine = productObject._id;
      }
    }

    if (req.body.machine && roleAPIFound) {
      let productConfObjec = getDocumentFromReq(req, 'new');





      const paramsToAdd = await ProductTechParam.find({ isActive: true, isArchived: false, isIniRead: true }).select('code category').lean();

      const fetchCodeValues = async (code) => {
        const propertyValues = [];

        for (const element of code) {
          const value = productConfObjec?.configuration[element];
          if (value) {
            propertyValues.push(value);
          } else {
            propertyValues.push("");
          }
        }
        return propertyValues;
      };

      const rotatedParams = await Promise.all(paramsToAdd.map(async (param) => {
        if(!Array.isArray(param.code)) {
          param.code = [param.code];
        }

        const codeValues = await fetchCodeValues(param.code);
        return { ...param, codeValues };
      }));

      await Promise.all(rotatedParams.map(async (datatoadd) => {
        for (const [index, val] of datatoadd.code.entries()) {
          if (datatoadd.codeValues[index]) {
            let req_ = { body: { ...req.body } };
            req_.body.techParam = datatoadd._id;
            req_.body.techParamValue = datatoadd.codeValues[index];
            const objectReceived = await productTechParamValueController.getDocumentFromReq(req_, 'new');
            await objectReceived.save();
          }
        }
      }));

      productConfObjec.configuration = replaceDotsWithSlashes(productConfObjec.configuration);
      const date = productConfObjec._id.getTimestamp();
      productConfObjec.backupid = date.toISOString().replace(/[-T:.Z]/g, '');

      let response = await this.dbservice.postObject(productConfObjec);

      if (!response) {
        logger.error(new Error(error));
        req.body.responseStatusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
      } else {
        req.body.refUUID = response._id;
        req.body.responseStatusCode = StatusCodes.CREATED;
        res.status(StatusCodes.CREATED).json({ ProductConfiguration: response });
      }
    } else {
      const errorCode = 400;
      req.body.responseStatusCode = errorCode;
      res.status(errorCode).send(!roleAPIFound ? "User is not allowed to access!" : errorCode);
    }

    const end = Date.now(); req.body.responseTime = end - start; let apiLogObject = apiLogController.getDocumentFromReq(req, 'new'); apiLogObject.save();
  }
};

function replaceDotsWithSlashes(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceDotsWithSlashes);
  }

  const newObj = {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.includes(".")) {
        const newKey = key.replace(/\./g, '---');
        newObj[newKey] = replaceDotsWithSlashes(obj[key]);
      } else {
        const newKey = key.replace(/\---/g, '.');
        newObj[newKey] = replaceDotsWithSlashes(obj[key]);
      }

    }
  }
  return newObj;
}

exports.patchProductConfiguration = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    this.dbservice.patchObject(ProductConfiguration, req.params.id, getDocumentFromReq(req), callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};


function getDocumentFromReq(req, reqType) {
  const { type, backupid, inputGUID, inputSerialNo, machine, configuration, isManufacture, backupDate, isActive, isArchived, loginUser } = req.body;
  let doc = {};
  if (reqType && reqType == "new") {
    doc = new ProductConfiguration({});
  }

  if ("type" in req.body) {
    doc.type = type;
  }

  if ("backupid" in req.body) {
    doc.backupid = backupid;
  }


  if ("machine" in req.body) {
    doc.machine = machine;
  }


  if ("inputGUID" in req.body) {
    doc.inputGUID = inputGUID;
  }

  if ("inputSerialNo" in req.body) {
    doc.inputSerialNo = inputSerialNo;
  }

  if ("configuration" in req.body) {
    doc.configuration = configuration;
  }

  if ("isManufacture" in req.body) {
    doc.isManufacture = isManufacture;
  }

  if ("backupDate" in req.body) {
    doc.backupDate = backupDate;
  }

  if ("isActive" in req.body) {
    doc.isActive = req.body.isActive === true || req.body.isActive === 'true' ? true : false;
  }

  if ("isArchived" in req.body) {
    doc.isArchived = req.body.isArchived === true || req.body.isArchived === 'true' ? true : false;
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