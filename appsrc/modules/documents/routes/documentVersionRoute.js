const express = require('express');
const { check } = require('express-validator');

const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');

const { Config } = require('../../config/models');

const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const multer = require("multer");
const awsService = require('../../../../appsrc/base/aws');
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
        const regex = new RegExp("^OPTIMIZE_IMAGE$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
        if(req.files && req.files['images']) {
          const documents_ = req.files['images'];
          await Promise.all(documents_.map(async (docx, index) => {
            if(configObject){
              await awsService.processImageFile(docx);
              docx.eTag = await awsService.generateEtag(docx.path);
            }
          }));
        }
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
      const regex = new RegExp("^OPTIMIZE_IMAGE$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value'); configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
      if(req.files && req.files['images']) {
        const documents_ = req.files['images'];
        await Promise.all(documents_.map(async (docx, index) => {
          if(configObject){
            await awsService.processImageFile(docx);
            docx.eTag = await awsService.generateEtag(docx.path);
          }
        }));
      }
      next();
    }
  });
}, controller.patchDocumentVersion);






  

// - /api/1.0.0/documents/documentVersion/:id
router.delete(`${baseRoute}/:documentid/versions/:id`, controller.deleteDocumentVersion);

module.exports = router;