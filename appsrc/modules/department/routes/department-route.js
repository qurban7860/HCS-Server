const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();


// router.use(checkAuth);

router.post('/', controllers.departmentController.addDepartment);

router.delete('/:id', controllers.departmentController.deleteDepartment);

router.put('/', controllers.departmentController.updateDepartment);

router.get('/', controllers.departmentController.getDepartments);

// router.get('/:id', controllers.departmentController.getAssets);

module.exports = router;
