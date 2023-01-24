const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const models = require('../models');
const HttpError = require('../../config/models/http-error');


// GET LOCATIONS
const getLocations = async (req, res, next) => {
  let locations;
  try {
    locations = await models.Location.find();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find any Location.',
      500
    );
    return next(error);
  }

  if (!locations) {
    const error = new HttpError(
      'No Location Found',
      404
    );
    return next(error);
  }

  res.json({ locations: locations });

};


// SAVE LOCATION
const addLocation = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const { name } = req.body;

  const newLocation = new models.Location({
    name
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newLocation.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(201).json({ location: newLocation });
};


// UPDATE LOCATION
const updateLocation = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name } = req.body;
  const locationId = req.body.id;

  let updatedLocation;
  try {
    updatedLocation = await models.Location.findById(locationId);
    updatedLocation.name = name;
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
    await updatedLocation.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(200).json({ location: updatedLocation });
};


// DELETE LOCATION
const deleteLocation = async (req, res, next) => {
  const locationId = req.params.id;

  let location;
  try {
    location = await models.Location.findOneAndRemove(locationId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete asset.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted Location.' });
};


// exports.getasset = getasset;
exports.addLocation = addLocation;
exports.updateLocation = updateLocation;
exports.deleteLocation = deleteLocation;
exports.getLocations = getLocations;
