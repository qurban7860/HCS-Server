const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controller = require('../controllers/articleCategory');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/support/settings/articleCategory

const baseRoute = `/articleCategory`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/support/settings/articleCategory/list
router.get(`${baseRoute}/list`, controller.getArticleCategories);

// - /api/1.0.0/support/settings/articleCategory/:id
router.get(`${baseRoute}/:id`, controller.getArticleCategory);

// - /api/1.0.0/support/settings/articleCategory/
router.post(`${baseRoute}/`,controller.postArticleCategory);

// - /api/1.0.0/support/settings/articleCategory/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchArticleCategory);

// - /api/1.0.0/support/settings/articleCategory/:id
router.delete(`${baseRoute}/:id`, controller.deleteArticleCategory);

module.exports = router;