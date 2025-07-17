const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const controllers = require('../controllers');
const controller = controllers.errorController;

const router = express.Router();

router.use(checkAuth);

// - /api/1.0.0/error/
router.get(`/`, controller.getError);
router.get(`/:id`, controller.getErrors);
router.post(`/`, controller.postError);
router.patch(`/:id`, controller.patchError);
router.delete(`/:id`, verifyDelete, controller.deleteError);

module.exports = router;