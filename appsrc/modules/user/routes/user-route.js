const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');

const router = express.Router();
this.cntrl = controllers.userController;


router.post(
'/signup',
[
check('firstName').not().isEmpty(),
check('lastName').not().isEmpty(),
check('email').normalizeEmail().isEmail(),
check('password').isLength({ min: 6 })
],
this.cntrl.signup
);

router.post('/login', this.cntrl.login);

router.post('/add-new-user', fileUpload.single('image'), this.cntrl.newUser);

router.post('/',fileUpload.single('image'), this.cntrl.postUser);

router.get('/', this.cntrl.getUsers);

router.get('/:id', this.cntrl.getUser);

router.delete('/:id', this.cntrl.deleteUser);




module.exports = router;