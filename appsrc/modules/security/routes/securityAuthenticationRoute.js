const express = require('express');
const { check } = require('express-validator');

const { SecurityUser } = require('../models');
const checkUserID = require('../../../middleware/check-parentID')('user', SecurityUser);

const controllers = require('../controllers');
const controller = controllers.securityAuthenticationController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/users/

// - /api/1.0.0/security/users/:id
// const baseRoute = `/users`;

// router.use(checkAuth);

// - /api/1.0.0/security/getToken/

router.post(`/getToken`, controller.login);


/*
router.get("/", (req, res) => {
  res.send("Hello World!... i am testing");
});
*/

// - /api/1.0.0/security/logout/:userID
router.post(`/logout/:userID`, controller.logout);

module.exports = router;