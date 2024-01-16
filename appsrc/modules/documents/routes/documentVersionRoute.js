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
const sharp = require('sharp');
const awsService = require('../../../../appsrc/base/aws');

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
      if(req.files && req.files['images']) {
        const images = req.files['images'];
        await Promise.all(images.map(async (image) => {
          console.log("image", image);
          const regex = new RegExp("^OPTIMIZE_IMAGE$", "i");
          let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
          configObject = configObject && configObject.value.trim().toLowerCase() === 'true' ? true:false;
          console.log("configObject", configObject);
          if(configObject){
            if(image.mimetype.includes('image')){

              let imageResolution = getImageResolution(image.path);
              // let desiredQuality = calculateDesiredQuality(image.path, imageResolution);

              const buffer = await sharp(image.path)
                .jpeg({
                quality: desiredQuality,
                mozjpeg: true
                })
                .toBuffer();
                const base64String = buffer.toString('base64');
              image.buffer = base64String;
              image.eTag = await awsService.generateEtag(image.path);
            }
          }
        }));
      }
      next();
    }
  });
}, controller.patchDocumentVersion);


async function getImageResolution(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    console.log("metadata", metadata);
    const width = metadata.width;
    const height = metadata.height;
    
    console.log(`Image Resolution: ${width} x ${height}`);
    
    // You can return the resolution or perform other actions as needed
    return { width, height };
  } catch (err) {
    console.error('Error reading image metadata:', err);
    throw err; // Propagate the error or handle it as per your application's requirements
  }
}

function calculateDesiredQuality(imageBuffer, imageResolution) {
  let desiredQuality = 100;

  // Set thresholds based on image size
  const sizeThresholds = {
    small: 2 * 1024 * 1024, // 2MB
    medium: 5 * 1024 * 1024, // 5MB
    large: 10 * 1024 * 1024, // 10MB
    extraLarge: 20 * 1024 * 1024, // 20MB
  };

  // Set resolution thresholds
  const resolutionThresholds = {
    low: 800,  // Low resolution threshold (e.g., 800 pixels)
    medium: 1200, // Medium resolution threshold (e.g., 1200 pixels)
    high: 2000, // High resolution threshold (e.g., 2000 pixels)
    extraHigh: 3000, // Extra high resolution threshold (e.g., 3000 pixels)
  };

  const imageSize = imageBuffer.length;
  const imageWidth = imageResolution.width;

  // Adjust quality based on image size
  if (imageSize > sizeThresholds.extraLarge) {
    desiredQuality = 10; // Aggressive reduction for extra-large images
  } else if (imageSize > sizeThresholds.large) {
    desiredQuality = 20; // Moderate reduction for large images
  } else if (imageSize > sizeThresholds.medium) {
    desiredQuality = 30; // Moderate reduction for medium-sized images
  } else {
    desiredQuality = 50; // Default quality for smaller images
  }

  // Adjust quality based on image resolution
  if (imageWidth < resolutionThresholds.low) {
    desiredQuality += 10; // Increase quality for low-resolution images
  } else if (imageWidth > resolutionThresholds.extraHigh) {
    desiredQuality -= 10; // Decrease quality for extra high-resolution images
  }

  // Ensure the desired quality stays within a reasonable range
  desiredQuality = Math.max(10, Math.min(100, desiredQuality));
  return desiredQuality;
}

  

// - /api/1.0.0/documents/documentVersion/:id
router.delete(`${baseRoute}/:documentid/versions/:id`, controller.deleteDocumentVersion);

module.exports = router;