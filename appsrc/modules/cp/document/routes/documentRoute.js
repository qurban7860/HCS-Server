const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');
const controller = controllers.documentController;
const router = express.Router();

const baseRoute = `/document`;

router.use(checkAuth);

// - /api/1.0.0/document/documents/getAllDocumentsAgainstFilter/
router.get(`${baseRoute}/allDocumentsAgainstFilter/`, controller.getImagesAgainstDocuments);

// - /api/1.0.0/document/documents/duplicateDrawings/
router.get(`${baseRoute}/dublicateDrawings/`, controller.getduplicateDrawings);

// - /api/1.0.0/documents/:id
router.get(`${baseRoute}/:id`, controller.getDocument);

// - /api/1.0.0/documents/
router.get(`${baseRoute}/`, controller.getDocuments);


module.exports = router;