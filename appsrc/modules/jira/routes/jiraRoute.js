const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.jiraController;

const router = express.Router();

const baseRouteForObject = `/releases`; 

router.use(checkAuth, checkCustomer);


router.get(`${baseRouteForObject}/:id`, controller.getRelease);

router.get(`${baseRouteForObject}/`, controller.getReleases);

router.get(`/tickets/`, controller.getTickets);



module.exports = router;