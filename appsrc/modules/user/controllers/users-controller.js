const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../../../../appsrc/modules/config/models/http-error');
const { Users } = require('../models');

const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let UserService = require('../service/user-service')
this.userserv = new UserService();

let dbService = require('../../db/dbService')
let rtnMsg = require('../../config/static/static')

const logger = require('../../config/logger');

if (process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined) {
  this.debug = process.env.LOG_TO_CONSOLE;
} else {
  this.debug = false;
}

this.fields = {};
this.query = {};
this.orderBy = { name: 1 };
this.populate = '';

///////////////////////////////////////////////////////////////////////////

function getToken(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}

function validateUser(req) {
  const token = getToken(req);
  if (!token) {
    throw new Error("Authorization failed!");
  }
  let secret = 'supersecret_dont_share';
  jwt.verify(token, secret, function (err, decoded) {
    if (err) {
      throw new Error("Error : " + err);
    }
  });
  return true;
}

const signup = async (req, res, next) => {
  console.log(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { firstName, lastName, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await Users.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new Users({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    passwordText: password
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({
      accessToken: token,
      userId: createdUser.id,
      user: {
        email: createdUser.email,
        displayName: createdUser.firstName.concat(" ", createdUser.lastName),
      },
    });;
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await Users.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    accessToken: token,
    userId: existingUser.id,
    user: {
      email: existingUser.email,
      displayName: existingUser.firstName.concat(" ", existingUser.lastName),
    },
  });
};

exports.getUser = async (req, res, next) => {
  this.userserv.getObjectById(Users, this.fields, req.params.id, this.populate, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};


exports.getUsers = async (req, res, next) => {
  this.userserv.getUsers(Users, this.fields, this.query, this.orderBy, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

/**
* add user function
* @param {request} req - Request
* @param {response} res - Response
* @param {next} next - Next method to call
* @returns {json} - return json response at client
*/
exports.postUser = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const { firstName, lastName, email, password, address, country, state, city, zip,
      about, role, addedBy, phoneNumber } = req.body;

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)); return next(err);
    }

    const userSchema = new Users({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      passwordText: password,
      address,
      country,
      state,
      city,
      zip,
      about,
      addedBy,
      role,
      phoneNumber,
      createdAt: new Date(),
      image: req.file == undefined ? null : req.file.path,
    });

    this.userserv.postUser(userSchema, callbackFunc);
    function callbackFunc(error, response) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.json({ user: response });
      }
    }
  }
};

exports.patchUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(req.body.password, 12);
    } catch (err) {
      const error = new HttpError(
        'Could not create password, please try again.',
        500
      );
    return next(error);
    }
    req.body.password = hashedPassword;
    req.body.image = req.file == undefined ? req.body.imagePath : req.file.path;
    this.userserv.patchObject(req.params.id, req.body, callbackFunc);
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        res.status(StatusCodes.OK).send(rtnMsg.recordUpdateMessage(StatusCodes.OK, result));
      }
    }
  }
};

const newUser = async (req, res, next) => {
  const { firstName, lastName, phone, address, country, state, city, zip, about, addedBy } = req.body;

  let existingUser;

  try {
    existingUser = await Users.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Operation failed. Please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      const error = new HttpError(
        'Could not create user, please try again.',
        500
      );
      return next(error);
    }

    const createdUser = new Users({
      firstName,
      lastName,
      password: hashedPassword,
      phone,
      address,
      country,
      state,
      city,
      zip,
      about,
      addedBy,
      image: req.file.path,
    });

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdUser.save();
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError(
        err,
        500
      );
      return next(error);
    }

    res.status(201).json({ user: createdUser });
  }
  else {
    const error = new HttpError(
      'User already exists. Please enter a different email',
      403
    );
    return next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  const { id, phone, address, country, state, city, zip, about } = req.body;

  let existingUser;

  try {
    existingUser = await Users.findOne({ email: email });
    existingUser.update({ _id: doc._id }, { $set: { scores: zz } });
  } catch (err) {
    const error = new HttpError(
      'Operation failed. Please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'User not found',
      403
    );
    return next(error);
  }

  try {

  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    accessToken: token,
    userId: existingUser.id,
    user: {
      email: existingUser.email,
      displayName: existingUser.firstName.concat(" ", existingUser.lastName),
    },
  });
};

exports.deleteUser = async (req, res, next) => {
  this.userserv.deleteObject(req.params.id, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

// exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.newUser = newUser;
