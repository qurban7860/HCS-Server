const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../../middleware/file-upload');

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

router.post('/add-new-user', fileUpload.single('image'), controllers.userController.newUser);

//router.post('/',fileUpload.single('image'), controllers.userController.saveUser);

//router.delete('/:id', controllers.userController.deleteUser);

//router.put('/:id', controllers.userController.updateUser);

//router.get('/', controllers.userController.getUsers);

//router.get('/:id', controllers.userController.getUser);



module.exports = router;
