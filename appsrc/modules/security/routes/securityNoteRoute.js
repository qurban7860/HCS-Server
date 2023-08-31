const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.securityNoteController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/users/:userId/notes/

// - /api/1.0.0/users/:userId/notes/
const baseRoute = `/users/:userId/securityNotes`;

// router.use(checkAuth);



// - /api/1.0.0/users/:userId/notes/search
router.get(`${baseRoute}/search`, controller.searchSecurityNotes);

// - /api/1.0.0/users/:userId/notes/:id
router.get(`${baseRoute}/:id`, controller.getSecurityNote);

// - /api/1.0.0/users/:userId/notes/
router.get(`${baseRoute}/`,  controller.getSecurityNotes);


// - /api/1.0.0/users/:userId/notes/
router.post(`${baseRoute}/`, controller.postSecurityNote);

// - /api/1.0.0/users/:userId/notes/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityNote);

// - /api/1.0.0/users/:userId/notes/:id
router.delete(`${baseRoute}/:id`,  controller.deleteSecurityNote);


module.exports = router;