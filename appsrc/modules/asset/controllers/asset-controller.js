const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const models = require('../models');
const HttpError = require('../../config/models/http-error');
let dbFunctions = require('../../db/dbFunctions')

let rtnMsg = require('../../config/static/static')



this.db = new dbFunctions(models.Assets);

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };


exports.getAssets = async (req, res, next) => {
  this.db.getArray(this.fields, this.query, this.orderBy, response);
  function response(error, data) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json({ assets: data });
    }
  }
};

exports.deleteAsset = async (req, res, next) => {
  this.db.deleteObject(req.params.id, response);
  function response(error, result) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.deleteMsg(result));
    }
  }
};

exports.saveAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { department, location, assetModel, name, notes, serial, status, assetTag } = req.body;
    const assetSchema = new models.Assets({
      name,
      status,
      assetTag,
      assetModel,
      serial,
      location,
      department,
      notes,
      image: req.file == undefined ? null : req.file.path,
    });

    this.db.saveObject(assetSchema, response);
    function response(error, responce) {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ assets: responce });
      }
    }
  }
};

exports.updateAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { department, location, assetModel, name, notes, serial, status, assetTag, imagePath,
    replaceImage
  } = req.body;
  const assetID = req.params.id;
  console.log(assetID);
  let updatedAsset
  try {
    updatedAsset = await models.Assets.updateOne(
      { _id: assetID },
      {
        name,
        status,
        assetTag,
        assetModel,
        serial,
        location,
        department,
        notes,
        image: replaceImage == true ? req.file.path : imagePath,
      }
    );
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(200).json({ asset: updatedAsset });
};
