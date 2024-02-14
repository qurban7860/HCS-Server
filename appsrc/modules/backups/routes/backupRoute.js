const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.backupController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/backups/

const baseRouteForObject = `/backups/`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}:id`, controller.getBackup);

router.get(`${baseRouteForObject}`, controller.getBackups);

router.post(`${baseRouteForObject}`, controller.postBackup);

router.patch(`${baseRouteForObject}:id`, verifyDelete, controller.patchBackup);

router.delete(`${baseRouteForObject}:id`, controller.deleteBackup);

module.exports = router;