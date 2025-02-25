const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

const controllers = require('../controllers');
const controller = controllers.securitySignInLogController;

const router = express.Router();

// - /api/1.0.0/users/:userId/signinlogs/
const baseRoute = `/users/:userId/signinlogs`;

// - /api/1.0.0/users/:userId/signinlogs/search
router.get(`${baseRoute}/search`, controller.searchSignInLogs);

// - /api/1.0.0/users/:userId/signinlogs/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getSecuritySignInLog);

// - /api/1.0.0/users/:userId/signinlogs/
router.get(`${baseRoute}/`,  controller.getSecuritySignInLogs);

// - /api/1.0.0/users/:userId/signinlogs/
router.post(`${baseRoute}/`, controller.postSignInLog);

// - /api/1.0.0/users/:userId/signinlogs/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.id), verifyDelete, controller.patchSignInLog);

// - /api/1.0.0/users/:userId/signinlogs/:id
router.delete(`${baseRoute}/:id`,  checkIDs(validate.id), controller.deleteSignInLog);


module.exports = router;