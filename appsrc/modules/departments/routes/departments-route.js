const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.departmentController;

// router.use(checkAuth);

router.post('/', fileUpload.single('image'), this.cntrl.postDepartment);

router.get('/:id', this.cntrl.getDepartment);

router.get('/', this.cntrl.getDepartments);

router.put('/:id', fileUpload.single('image'), this.cntrl.patchDepartment);

router.delete('/:id', this.cntrl.deleteDepartment);

// router.get('/:id', controllers.departmentController.getAssets);

module.exports = router;