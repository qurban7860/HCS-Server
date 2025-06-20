const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controller = require('../controllers/project');

const router = express.Router();

const baseRoute = `/project`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/list`, controller.getProjects);

router.get(`${baseRoute}/:id`, controller.getProject);

router.post(`${baseRoute}/`, controller.postProject);

router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchProject);

router.delete(`${baseRoute}/:id`, controller.deleteProject);

module.exports = router;
