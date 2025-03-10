const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.backupController;

const router = express.Router();

// - /api/1.0.0/backups/

const baseRouteForObject = `/backups/`;

router.use(checkAuth);

router.get(`${baseRouteForObject}:id`, controller.getBackup);

router.get(`${baseRouteForObject}`, controller.getBackups);

module.exports = router;