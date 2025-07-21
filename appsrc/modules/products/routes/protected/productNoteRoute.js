const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const { Product } = require('../../models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productNoteController;

const router = express.Router();

const baseRouteForObject = `/machines/:machineId/notes`;

router.use(checkAuth);

router.get(`${baseRouteForObject}`, checkProductID, controller.getProductNotes);

router.post(`${baseRouteForObject}`, checkProductID, controller.postProductNote);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkProductID, controller.getProductNote);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkProductID, controller.patchProductNote);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkProductID, controller.deleteProductNote);

router.get(`${baseRouteForObject}/stream`, controller.streamProductNotes);

router.get('/notes/search', controller.searchProductNotes);


module.exports = router;