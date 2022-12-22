const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const Asset = require('../models/asset');

const getasset = async (req, res, next) => {
  let asset;
  try {
    asset = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching asset failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ asset: asset.map(user => user.toObject({ getters: true })) });
};


exports.getasset = getasset;
exports.signup = signup;
exports.login = login;
