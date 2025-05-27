const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controller = require('../controllers/article');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/support/knowledgeBase

const baseRoute = `/article`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/support/knowledgeBase/list
router.get(`${baseRoute}/list`, controller.getArticles);

// - /api/1.0.0/support/knowledgeBase/:id
router.get(`${baseRoute}/:id`, controller.getArticle);

// - /api/1.0.0/support/knowledgeBase/
router.post(`${baseRoute}/`,controller.postArticle);

// - /api/1.0.0/support/knowledgeBase/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchArticle);

// - /api/1.0.0/support/knowledgeBase/:id
router.delete(`${baseRoute}/:id`, controller.deleteArticle);

module.exports = router;