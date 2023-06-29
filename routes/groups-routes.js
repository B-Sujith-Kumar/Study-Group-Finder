const express = require('express');

const imageUploadMiddleware = require('../middlewares/image-upload');

const groupsController = require('../controllers/groups-controller');

const authController = require('../controllers/auth-controller');

const router = express.Router();

router.get('/', authController.getHome);

router.get('/groups', groupsController.exploreGroups)

router.get('/groups/create', groupsController.createGroupPage);

router.post('/groups/create', imageUploadMiddleware, groupsController.createGroup);

router.get('/groups/edit/:id', groupsController.getUpdateGroup);

router.post('/groups/edit/:id', imageUploadMiddleware, groupsController.updateGroup);

router.get('/groups/:id', groupsController.getGroupDetails);

router.post('/groups/delete/:id', groupsController.deleteGroup);

router.post('/groups/search', groupsController.searchGroup);

module.exports = router;