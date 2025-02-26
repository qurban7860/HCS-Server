const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const logger = require('../../config/logger');
const _ = require('lodash');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();

const { ProductConfiguration, Product, ProductTechParam } = require('../models');

const apiLogController = require('../../apiclient/controllers/apiLogController');

const productTechParamValueController = require('./productTechParamValueController');

const ObjectId = require('mongoose').Types.ObjectId;

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

exports.postProductConfiguration = async (req, res, next) => {
  const start = Date.now();

  const errors = validationResult(req);
  req.body.apiType = "INI";
  req.body.clientInfo = req.clientInfo;
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
      let productConfObjec = getDocFromReq(req);

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
        if (!Array.isArray(param.code)) {
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
            const objectReceived = await productTechParamValueController.getDocumentFromReq(req_, "new");
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

    const end = Date.now();
    req.body.responseTime = end - start;
    let apiLogObject = apiLogController.getDocumentFromReq(req, "new");
    apiLogObject.save();
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


function getDocFromReq(req) {

  const { type, backupid, inputGUID, inputSerialNo, machine, configuration, isManufacture, backupDate, clientInfo } = req.body;

  let doc = new ProductConfiguration({});

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

  if ("clientInfo" in req.body) {
    doc.createdByIdentifier = clientInfo.identifier;
    doc.createdIP = clientInfo.ip;
    doc.createdAt = new Date();
    doc.updatedByIdentifier = clientInfo.identifier;
    doc.updatedIP = clientInfo.ip;
    doc.updatedAt = new Date();
  }
  return doc;
}