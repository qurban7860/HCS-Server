const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', controllers.userController.getUsers);

router.post(
  '/signup',
  [
    check('firstName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 })
  ],
  controllers.userController.signup
);

router.post('/login', controllers.userController.login);


// router.post(
//   '/signup',
//   fileUpload.single('image'),
//   [
//     check('name')
//       .not()
//       .isEmpty(),
//     check('email')
//       .normalizeEmail()
//       .isEmail(),
//     check('password').isLength({ min: 6 })
//   ],
//   controllers.userController.signup
// );




module.exports = router;
