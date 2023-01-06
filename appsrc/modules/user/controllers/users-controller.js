const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../../../../global/models/http-error');
const models = require('../models');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await models.Users.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};


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
    existingUser = await models.Users.findOne({ email: email });
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

  const createdUser = new models.Users({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  // const createdUser = new User({
  //   firstName,
  //   lastName,
  //   email,
  //   image: req.file.path,
  //   password: hashedPassword,
  //   places: []
  // });

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
        displayName: createdUser.firstName.concat(" ",createdUser.lastName),
      },
    });;
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await models.Users.findOne({ email: email });
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
      displayName: existingUser.firstName.concat(" ",existingUser.lastName),
    },
  });
};

const updateUserProfile = async (req, res, next) => {
  const { id, phone, address, country, state, city, zip, about } = req.body;

  let existingUser;

  try {
    existingUser = await models.Users.findOne({ email: email });
    existingUser.update({_id:doc._id}, {$set:{scores:zz}});
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
      displayName: existingUser.firstName.concat(" ",existingUser.lastName),
    },
  });
};

const addNewUser = async (req, res, next) => {
  const { firstName, lastName, phone, address, country, state, city, zip, about, addedBy } = req.body;

  let existingUser;

  try {
    existingUser = await models.Users.findOne({ email: email });
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
 
   const createdUser = new models.Users({
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
   else{
      const error = new HttpError(
      'User already exists. Please enter a different email',
      403
      );
      return next(error);
    }
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.addNewUser = addNewUser;
