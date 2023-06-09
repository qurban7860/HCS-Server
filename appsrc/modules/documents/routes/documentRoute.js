const express = require('express');
const { check } = require('express-validator');

const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const multer = require("multer");


const controllers = require('../controllers');
const controller = controllers.documentController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/documents/
const baseRoute = `/document`;


router.use(checkAuth, checkCustomer);

// - /api/1.0.0/documents/:id
router.get(`${baseRoute}/:id`,controller.getDocument);

// - /api/1.0.0/documents/
router.get(`${baseRoute}/`, controller.getDocuments);

// - /api/1.0.0/documents/
router.post(`${baseRoute}/`, (req, res, next) => {
    fileUpload.fields([{name:'images', maxCount:10}])(req, res, (err) => {

      if (err instanceof multer.MulterError) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
      } else if (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        next();
      }
    });
  }, controller.postDocument);

// - /api/1.0.0/documents/:id
router.patch(`${baseRoute}/:id`,(req, res, next) => {
    fileUpload.fields([{name:'images', maxCount:10}])(req, res, (err) => {

      if (err instanceof multer.MulterError) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
      } else if (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        next();
      }
    });
  }, controller.patchDocument);

// - /api/1.0.0/documents/files/:id
router.delete(`${baseRoute}/:id`, controller.deleteDocument);

module.exports = router;