const express = require('express');
const verifyDelete = require('../../../../middleware/verifyDelete');
const controller = require('../controllers').ArticleController;
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const router = express.Router({ mergeParams: true });

// - /api/1.0.0/support/knowledgeBase/article

router.get(`/list`, controller.getArticles);
router.get(`/:id`, controller.getArticle);
router.post(`/`, uploadHandler, checkMaxCount, imageOptimization, controller.postArticle);
router.patch(`/:id`, uploadHandler, checkMaxCount, imageOptimization, verifyDelete, controller.patchArticle);
router.delete(`/:id`, controller.deleteArticle);

module.exports = router;