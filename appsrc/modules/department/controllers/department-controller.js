const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const models = require('../models');
const HttpError = require('../../config/models/http-error');


// GET DEPARTMENTS
const getDepartments = async (req, res, next) => {
  let departments;
  try {
    departments = await models.Department.find();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find any Department.',
      500
    );
    return next(error);
  }

  if (!departments) {
    const error = new HttpError(
      'No Department Found',
      404
    );
    return next(error);
  }

  res.json({ departments: departments });

};


// SAVE DEPARTMENT
const addDepartment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const { name } = req.body;

  const newDepartment = new models.Department({
    name
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newDepartment.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(201).json({ department: newDepartment });
};


// UPDATE DEPARTMENT
const updateDepartment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name } = req.body;
  const departmentId = req.body.id;

  let updatedDepartment;
  try {
    updatedDepartment = await models.Department.findById(departmentId);
    updatedDepartment.name = name;
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
    await updatedDepartment.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }

  res.status(200).json({ department: updatedDepartment });
};


// DELETE DEPARTMENT
const deleteDepartment = async (req, res, next) => {
  const departmentId = req.params.id;

  let department;
  try {
    department = await models.Department.findOneAndRemove(departmentId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete asset.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted Department.' });
};


// exports.getasset = getasset;
exports.addDepartment = addDepartment;
exports.updateDepartment = updateDepartment;
exports.deleteDepartment = deleteDepartment;
exports.getDepartments = getDepartments;
