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
const controller = controllers.documentFileController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/documents/documentFile/
const baseRoute = `/document`;


router.use(checkAuth, checkCustomer);

// - /api/1.0.0/documents/documentFile/:id
router.get(`${baseRoute}/:documentid/versions/:versionid/files/:id`,controller.getDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.get(`${baseRoute}/:documentid/versions/:versionid/files/:id/download/`, controller.downloadDocumentFile);

// - /api/1.0.0/documents/documentFile/
router.get(`${baseRoute}/:documentid/versions/:versionid/files/`, controller.getDocumentFiles);

// - /api/1.0.0/documents/documentFile/
router.post(`${baseRoute}/:documentid/versions/:versionid/files/`, (req, res, next) => {
    fileUpload.fields([{name:'images', maxCount:1}])(req, res, (err) => {

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
  }, controller.postDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.patch(`${baseRoute}/:documentid/versions/:versionid/files/:id`, controller.patchDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.delete(`${baseRoute}/:documentid/versions/:versionid/files/:id`, controller.deleteDocumentFile);

module.exports = router;