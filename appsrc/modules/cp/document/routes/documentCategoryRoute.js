const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');
const controller = controllers.documentCategoryController;
const router = express.Router();

const baseRoute = `/categories`;

router.use(checkAuth);

// - /api/1.0.0/cp/documents/categories/
router.get(`${baseRoute}/`, controller.getDocumentCategories);

module.exports = router;