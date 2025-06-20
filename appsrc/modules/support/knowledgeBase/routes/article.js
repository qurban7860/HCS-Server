const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controller = require('../controllers/article');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/support/knowledgeBase

const baseRoute = `/article`;

router.use(checkAuth);
router.get(`${baseRoute}/list`, controller.getArticles);
router.get(`${baseRoute}/:id`, controller.getArticle);
router.post(`${baseRoute}/`, controller.postArticle);
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchArticle);
router.delete(`${baseRoute}/:id`, controller.deleteArticle);

module.exports = router;