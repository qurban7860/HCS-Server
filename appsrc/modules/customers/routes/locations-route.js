const express = require('express');
const { check } = require('express-validator');
const controllers = require('../controllers');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();


router.use(checkAuth);

router.post('/', controllers.locationController.addLocation);

router.delete('/:id', controllers.locationController.deleteLocation);

router.put('/', controllers.locationController.updateLocation);

//router.get('/', controllers.lcontrollersocationController.getLocations);

// router.get('/:id', controllers.locationController.getAssets);

module.exports = router;controllers
