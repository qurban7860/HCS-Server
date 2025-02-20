const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.departmentController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/crm

// - /api/1.0.0/crm/department 
const baseRouteForObject = `/departments`; 

// EndPoint: {{baseUrl}}/crm/department/:id
// localhost://api/1.0.0/crm/department 

router.use(checkAuth);

// - /api/1.0.0/crm/department
router.get(`${baseRouteForObject}/search`, controller.searchDepartments);

// - /api/1.0.0/crm/department/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.departmentIdAndId), controller.getDepartment);

// - /api/1.0.0/crm/department/
router.get(`${baseRouteForObject}/`, controller.getDepartments);

// - /api/1.0.0/crm/department/
router.post(`${baseRouteForObject}/`, controller.postDepartment);

// - /api/1.0.0/crm/department/:id
router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.departmentIdAndId), verifyDelete, controller.patchDepartment);

// - /api/1.0.0/crm/department/:id
router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.departmentIdAndId), controller.deleteDepartment);

module.exports = router;