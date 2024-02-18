const express = require('express');
const { check } = require('express-validator');

const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const roleCheck = require('../../../middleware/role-check');

const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const multer = require("multer");
const { Config } = require('../../config/models');
const awsService = require('../../../../appsrc/base/aws');


const controllers = require('../controllers');
const controller = controllers.documentController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/documents/
const baseRoute = `/document`;


router.use(checkAuth, roleCheck, checkCustomer);

// - /api/1.0.0/document/documents/getAllDocumentsAgainstFilter/
router.get(`${baseRoute}/allDocumentsAgainstFilter/`, controller.getImagesAgainstDocuments);

// - /api/1.0.0/document/documents/patchDocumentFilesETag/
router.put(`${baseRoute}/putDocumentFilesETag/`, controller.putDocumentFilesETag);

// - /api/1.0.0/document/documents/dublicateDrawings/
router.get(`${baseRoute}/dublicateDrawings/`, controller.getdublicateDrawings);

// - /api/1.0.0/documents/:id
router.get(`${baseRoute}/:id`,controller.getDocument);

// - /api/1.0.0/documents/
router.get(`${baseRoute}/`, controller.getDocuments);

// - /api/1.0.0/documents/
router.post(`${baseRoute}/`, async (req, res, next) => {
    const regex_ = new RegExp("^MAX_UPLOAD_FILES$", "i"); 
    const maxCountObj = await Config.findOne({name: regex_, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
    const maxCount =  maxCountObj && !isNaN(maxCountObj.value) ? maxCountObj.value : 20;
    console.log("maxCount", maxCount);
    fileUpload.fields([{name:'images', maxCount:maxCount}])(req, res, async (err) => {

      if (err instanceof multer.MulterError) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
      } else if (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
        if(req.files && req.files['images']) {
          const documents_ = req.files['images'];
          await Promise.all(documents_.map(async (docx, index) => {
            docx.eTag = await awsService.generateEtag(docx.path);
            if(configObject){
              await awsService.processImageFile(docx);
            }
          }));
        }
        next();
      }
    });
  }, controller.postDocument);


// - /api/1.0.0/documents/
router.post(`${baseRoute}multi/`, async (req, res, next) => {
  const regex_ = new RegExp("^MAX_UPLOAD_FILES$", "i"); 
  const maxCountObj = await Config.findOne({name: regex_, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
  const maxCount =  maxCountObj && !isNaN(maxCountObj.value) ? maxCountObj.value : 20;
  console.log("maxCount", maxCount, req.images);
  fileUpload.fields([{name:'images', maxCount:maxCount}])(req, res, async (err) => {
    
    // console.log(req);
    if (err instanceof multer.MulterError) {
      console.log(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
    } else if (err) {
      console.log(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
      if(req.files && req.files['images']) {
        const documents_ = req.files['images'];
        await Promise.all(documents_.map(async (docx, index) => {
          docx.eTag = await awsService.generateEtag(docx.path);
          if(configObject){
            await awsService.processImageFile(docx);
          }
        }));
      }
      next();
    }
  });
}, controller.postMultiDocument);
  
// - /api/1.0.0/documents/updatedVersion/:id
router.patch(`${baseRoute}/updatedVersion/:id`, controller.patchDocumentVersion);

// - /api/1.0.0/documents/:id
router.patch(`${baseRoute}/:id`,async (req, res, next) => {
    const regex_ = new RegExp("^MAX_UPLOAD_FILES$", "i"); 
    const maxCountObj = await Config.findOne({name: regex_, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
    const maxCount =  maxCountObj && !isNaN(maxCountObj.value) ? maxCountObj.value : 20;
    console.log("maxCount", maxCount);
    fileUpload.fields([{name:'images', maxCount:maxCount}])(req, res, async (err) => {

      if (err instanceof multer.MulterError) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err._message);
      } else if (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      } else {
        const regex = new RegExp("^OPTIMIZE_IMAGE_ON_UPLOAD$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
        if(req.files && req.files['images']) {
          const documents_ = req.files['images'];
          await Promise.all(documents_.map(async (docx, index) => {
            docx.eTag = await awsService.generateEtag(docx.path);
            if(configObject){
              await awsService.processImageFile(docx);
            }
          }));
        }
        next();
      }
    });
  }, controller.patchDocument);


  // router.patch(`${baseRoute}/:id`, (req, res, next) => {
  //   // Resize images before uploading
  //   resizeImages(req, res, () => {
  //     // Now, call the multer middleware
  //     fileUpload.fields([{ name: 'images', maxCount: 200 }])(req, res, (err) => {
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