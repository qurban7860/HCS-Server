const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.logController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

router.get(`/`, controller.getLogs);
// GET /api/1.0.0/productLogs/

router.get(`/logsByApiId`, controller.getLogsByApiId);
// GET /api/1.0.0/productLogs/logsByApiId

router.get(`/graph`, controller.getLogsGraph);
// GET /api/1.0.0/productLogs/graph

router.get(`/:id`, checkIDs(validate.id), controller.getLog);
// GET /api/1.0.0/productLogs/:id

router.post(`/`, controller.postLog);
// POST /api/1.0.0/productLogs/

router.patch(`/:id`, checkIDs(validate.id), controller.patchLog);
// Patch /api/1.0.0/productLogs/:id

router.delete(`/:id`, checkIDs(validate.id), controller.deleteLog);
// Patch /api/1.0.0/productLogs/:id
module.exports = router;