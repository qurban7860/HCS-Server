const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controller = require('../controllers/release');

const router = express.Router();

const baseRoute = `/release`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/list`, controller.getReleases);

router.get(`${baseRoute}/:id`, controller.getRelease);

router.post(`${baseRoute}/`, controller.postRelease);

router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchRelease);

router.delete(`${baseRoute}/:id`, controller.deleteRelease);

module.exports = router;
