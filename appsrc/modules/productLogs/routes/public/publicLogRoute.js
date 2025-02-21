const express = require('express');

const controllers = require('../../controllers');
const verifyMachineAuth = require('../../../../middleware/verifyMachineIntegration');
const controller = controllers.publicLogController;

const router = express.Router();

router.use(verifyMachineAuth);

router.post('/importLogs', controller.postPublicLog);
router.post('/postLogs', controller.postPublicLog);

module.exports = router;