const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const controllers = require('../controllers');
const controller = controllers.httpCodeController;

const router = express.Router();

router.use(checkAuth);

// - /api/1.0.0/httpCode/
router.get(`/`, controller.getHttpCodes);
router.get(`/:id`, controller.getHttpCode);
router.post(`/`, controller.postHttpCode);
router.patch(`/:id`, controller.patchHttpCode);
router.delete(`/:id`, verifyDelete, controller.deleteHttpCode);

module.exports = router;