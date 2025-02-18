const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');;
const controller = controllers.documentController;
const router = express.Router();
const checkIDs = require('../../../../middleware/validateParamIDs');
const validateMachineInQuery = require('../../../../middleware/validateMachineInQuery');
const validateMachineDrawingCustomer = require('../../../../middleware/validateMachineDrawingCustomer');
const validate = require('../../utils/validate');
const baseRoute = `/document`;

router.use(checkAuth);

// - /api/1.0.0/cp/documents/document/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), validateMachineInQuery, validateMachineDrawingCustomer, controller.getDocument);


module.exports = router;