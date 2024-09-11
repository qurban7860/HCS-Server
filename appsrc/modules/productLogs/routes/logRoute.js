const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.logController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

router.get(`/`, controller.getLogs);
// GET /api/1.0.0/logs/

router.get(`/graph`, controller.getLogsGraph);
// GET /api/1.0.0/logs/graph

router.get(`/:id`, controller.getLog);
// GET /api/1.0.0/logs/:id

router.post(`/`, controller.postLog);
// POST /api/1.0.0/logs/

router.patch(`/:id`, controller.patchLog);
// Patch /api/1.0.0/logs/:id

module.exports = router;