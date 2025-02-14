const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../products/controllers');
const controller = controllers.productDrawingController;
const router = express.Router();
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const baseRoute = `/drawings`;

router.use(checkAuth);

// - /api/1.0.0/cp/products/drawings:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getProductDrawing);

// - /api/1.0.0/cp/products/drawings
router.get(`${baseRoute}/`, controller.getProductDrawings);

module.exports = router;