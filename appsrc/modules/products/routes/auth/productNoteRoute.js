const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const { Product } = require('../../models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');


const controllers = require('../../controllers');
const controller = controllers.productNoteController;

const router = express.Router();

const baseRouteForObject = `/machines/:machineId/notes`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkProductID, controller.getProductNote);

router.get(`${baseRouteForObject}`, checkProductID, controller.getProductNotes);

router.post(`${baseRouteForObject}`, checkProductID, controller.postProductNote);

router.patch(`${baseRouteForObject}/:id`, checkProductID, verifyDelete, controller.patchProductNote);

router.delete(`${baseRouteForObject}/:id`, checkProductID, controller.deleteProductNote);

router.get('/notes/search', controller.searchProductNotes);

module.exports = router;