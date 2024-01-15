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

// - /api/1.0.0/document/documents/getAllDocumentsAgainstFilter/
router.get(`${baseRoute}/allDocumentsAgainstFilter/`, controller.getAllDocumentsAgainstFilter);

// - /api/1.0.0/document/documents/patchDocumentFilesETag/
router.put(`${baseRoute}/putDocumentFilesETag/`, controller.putDocumentFilesETag);

// - /api/1.0.0/document/documents/dublicateDrawings/
router.get(`${baseRoute}/dublicateDrawings/`, controller.getdublicateDrawings);

// - /api/1.0.0/documents/:id
router.get(`${baseRoute}/:id`,controller.getDocument);

// - /api/1.0.0/documents/
router.get(`${baseRoute}/`, controller.getDocuments);

const upload = multer({ dest: 'uploads/' })
router.post(`/aaaaaaaa/`,upload.single('document'),  controller.testing);

// - /api/1.0.0/documents/
router.post(`${baseRoute}/`, (req, res, next) => {
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
  }, controller.postDocument);
  
// - /api/1.0.0/documents/updatedVersion/:id
router.patch(`${baseRoute}/updatedVersion/:id`, controller.patchDocumentVersion);

// - /api/1.0.0/documents/:id
router.patch(`${baseRoute}/:id`,(req, res, next) => {
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
  }, controller.patchDocument);


  // router.patch(`${baseRoute}/:id`, (req, res, next) => {
  //   // Resize images before uploading
  //   resizeImages(req, res, () => {
  //     // Now, call the multer middleware
  //     fileUpload.fields([{ name: 'images', maxCount: 20 }])(req, res, (err) => {
  //       if (err instanceof multer.MulterError) {
  //         console.log(err);
  //         res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
  //       } else if (err) {
  //         console.log(err);
  //         res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  //       } else {
  //         next();
  //       }
  //     });
  //   });
  // }, controller.patchDocument);

  // Define a middleware to resize images
  function resizeImages(req, res, next) {
    const images = req.files['images'];
    // Check if 'images' field exists and contains files
    if (images && images.length > 0) {
      // Loop through each image and resize
      images.forEach((image) => {
        sharp(image.path)
          .resize({ width: 500, height: 500 })
          .toFile(`path/to/resize/${image.filename}`, (err) => {
            if (err) {
              console.error('Error resizing image:', err);
            }
          });
      });
      next();
    } else {
      next();
    }
  }



// - /api/1.0.0/documents/files/:id
router.delete(`${baseRoute}/:id`, controller.deleteDocument);

module.exports = router;