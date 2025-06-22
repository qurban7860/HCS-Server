const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const verifyDelete = require('../../../../middleware/verifyDelete');
const controller = require('../controllers').ArticleFileController;
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const router = express.Router({ mergeParams: true });

// - /api/1.0.0/support/knowledgeBase/article/:articleId/files

router.get(`/`, controller.getArticleFiles);
router.get(`/:id`, controller.getArticleFile);
router.post(`/`, uploadHandler, checkMaxCount, imageOptimization, controller.postArticleFiles);
router.delete(`/:id`, verifyDelete, controller.deleteArticleFile);

module.exports = router;