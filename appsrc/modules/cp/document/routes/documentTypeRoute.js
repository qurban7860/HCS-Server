const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');
const controller = controllers.documentTypeController;

const router = express.Router();

const baseRoute = `/documentType`;

router.use(checkAuth);

// - /api/1.0.0/cp/documents/documentType/
router.get(`${baseRoute}/`, controller.getDocumentTypes);


module.exports = router;