const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode}  = require('http-status-codes');

const models = require('../models');
const HttpError = require('../../config/models/http-error');
let dbFunctions = require('../../db/dbFunctions')


this.db = new dbFunctions(models.Assets);

//Error Handling is pending in response


this.fields = {};
this.query = {};
this.orderBy = {name: 1};


const getAssets = async (req, res, next) => {
    this.db.getArray(this.fields ,this.query, this.orderBy, response);
    function response(error, data) {    
      if(!error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ assets: data });
      }
    }
};


//Error Handling is pending in response
const saveAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const { department, location, assetModel, name, notes, serial, status, assetTag } = req.body;

  // let assetSchema = new models.Assets();
  // assetSchema = req.body;
  // assetSchema.image = req.file.path;

  const assetSchema = new models.Assets({
    name,
    status,
    assetTag,
    assetModel,
    serial,
    location,
    department,
    notes,
    image: req.file.path,
  });

  this.db.saveObject(assetSchema, response);
  function response(error, data) {      
    error ? "": res.status(201).json({ asset: data });
  }
};


// to be work on.



















const updateAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { department, location, assetModel, name, notes, serial, status, assetTag,
    replaceImage
  } = req.body;
  const assetID = req.body.id;

  let updatedAsset;
  try {
    updatedAsset = await models.Assets.findById(assetID);
    updatedAsset.name = name;
    updatedAsset.assetTag = assetTag;
    updatedAsset.department = department;
    updatedAsset.location = location;
    updatedAsset.assetModel = assetModel;
    updatedAsset.notes = notes;
    updatedAsset.serial = serial;
    updatedAsset.status = status;
    updated.image = req.file.path;


    // if(replaceImage){
    //   asset = await models.Assets.findByIdAndUpdate(assetID, {$set: assetData});
    // }
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await updatedAsset.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(200).json({ asset: updatedAsset });
};


// DELETE ASSET
const deleteAsset = async (req, res, next) => {
  const assetID = req.params.id;

  let asset;
  try {
    asset = await models.Assets.findOneAndRemove(assetID);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete asset.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted Asset.' });
};


// exports.getasset = getasset;
exports.saveAsset = saveAsset;
exports.updateAsset = updateAsset;
exports.deleteAsset = deleteAsset;
exports.getAssets = getAssets;
