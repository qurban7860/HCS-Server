const express = require('express');
const { check } = require('express-validator');

const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const multer = require("multer");
const sharp = require('sharp');

const controllers = require('../controllers');
const controller = controllers.documentVersionController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/documents/documentVersion/
const baseRoute = `/document`;


router.use(checkAuth, checkCustomer);

// - /api/1.0.0/documents/documentVersion/:id
router.get(`${baseRoute}/:documentid/versions/:id`,controller.getDocumentVersion);

// - /api/1.0.0/documents/documentVersion/
router.get(`${baseRoute}/:documentid/versions/`, controller.getDocumentVersions);

// - /api/1.0.0/documents/documentVersion/
router.post(`${baseRoute}/:documentid/versions/`, (req, res, next) => {
    fileUpload.fields([{name:'images', maxCount:20}])(req, res, (err) => {

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
  }, controller.postDocumentVersion);

// - /api/1.0.0/documents/documentVersion/:id
router.patch(`${baseRoute}/:documentid/versions/:id`, (req, res, next) => {
  fileUpload.fields([{name:'images', maxCount:20}])(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
    } else if (err) {
      console.log(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      console.log("Before req.files", req.files);
      if(req.files && req.files['images']) {
        const images = req.files['images'];
        await Promise.all(images.map(async (image) => {
          const buffer = await sharp(image.buffer)
            .resize(300, 300)
            .toBuffer();

          // Replace the original buffer with the processed buffer
          image.buffer = buffer;
        }));
      }
      console.log("After req.files", req.files);
      next();
    }
  });
}, controller.patchDocumentVersion);






  

// - /api/1.0.0/documents/documentVersion/:id
router.delete(`${baseRoute}/:documentid/versions/:id`, controller.deleteDocumentVersion);

module.exports = router;