const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');


const controllers = require('../controllers');
const controller = controllers.securityAuthenticationController;

const router = express.Router();

// router.use(checkAuth);

// - /api/1.0.0/security/getToken/
// router.post(`/getToken/`, controller.login);


module.exports = router;