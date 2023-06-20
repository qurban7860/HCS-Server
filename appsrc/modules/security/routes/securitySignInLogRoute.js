const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.securitySignInLogController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/users/:userId/signinlogs/

// - /api/1.0.0/users/:userId/signinlogs/
const baseRoute = `/users/:userId/signinlogs`;

// router.use(checkAuth);



// - /api/1.0.0/users/:userId/signinlogs/search
router.get(`${baseRoute}/search`, controller.searchSignInLogs);

// - /api/1.0.0/users/:userId/signinlogs/:id
router.get(`${baseRoute}/:id`, controller.getSecuritySignInLog);

// - /api/1.0.0/users/:userId/signinlogs/
router.get(`${baseRoute}/`,  controller.getSecuritySignInLogs);


// - /api/1.0.0/users/:userId/signinlogs/
router.post(`${baseRoute}/`, controller.postSignInLog);

// - /api/1.0.0/users/:userId/signinlogs/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSignInLog);

// - /api/1.0.0/users/:userId/signinlogs/:id
router.delete(`${baseRoute}/:id`,  controller.deleteSignInLog);


module.exports = router;