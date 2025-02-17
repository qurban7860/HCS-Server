const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');;
const controller = controllers.documentController;
const router = express.Router();
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const baseRoute = `/document`;

router.use(checkAuth);

// - /api/1.0.0/cp/documents/document/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getDocument);


module.exports = router;