const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const models = require('../models');
const HttpError = require('../../../../global/models/http-error');


// GET ASSETS
const getAssets = async (req, res, next) => {
  let assets;
  try {
    assets = await models.Assets.find();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a Assets.',
      500
    );
    return next(error);
  }

  if (!assets) {
    const error = new HttpError(
      'No Assets Found',
      404
    );
    return next(error);
  }

  res.json({ assets: assets });

};


// SAVE ASSET
const saveAsset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  // console.log(image);
  const { department, location, assetModel, name, notes, serial, status, assetTag
   } = req.body;
   console.log("req", req.body);

  const createdAsset = new models.Assets({
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

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdAsset.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(201).json({ asset: createdAsset });
};


// UPDATE ASSET
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
