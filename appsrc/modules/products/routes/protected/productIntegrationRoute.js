const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');

const controller = controllers.productIntegrationController;

const router = express.Router();

const baseRouteForObject = `/machines/:machineId/integration`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, controller.getIntegrationDetails);

router.post(`${baseRouteForObject}/portalkey`, controller.postIntegrationPortalKey);

router.post(`${baseRouteForObject}/details`, controller.postIntegrationDetails);

router.get(`${baseRouteForObject}/streamIntegrationStatus`, controller.streamMachineIntegrationStatus);


module.exports = router;