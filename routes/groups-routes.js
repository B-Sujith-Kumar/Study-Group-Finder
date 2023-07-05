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

router.post('/groups/your-groups/:id', groupsController.getYourGroups);

router.post('/groups/join/:id', groupsController.joinGroup);

router.post('/groups/leave-group/:id', groupsController.leaveGroup);

router.post('/groups/view-members/:id', groupsController.viewMembers);

router.post('/groups/:grpId/remove-member/:userId', groupsController.removeMember);

router.get('/groups/create-announcement/:id', groupsController.getCreateAnnouncement);

router.post('/groups/created-announcement/:id', groupsController.createAnnouncement);

router.post('/groups/view-announcements/:id', groupsController.viewAnnouncements);

router.post('/groups/:grpId/delete-announcement/:id', groupsController.deleteAnnouncement);

router.get('/groups/create-blog/:id', groupsController.getCreateBlog);

router.post('/groups/created-blog/:id', groupsController.createBlog);

router.post('/groups/view-blogs/:id', groupsController.viewBlogs);

router.get('/groups/:grpId/view-blog/:id', groupsController.viewFullBlog);

router.post('/groups/:grpId/delete-blog/:id', groupsController.deleteBlog);

module.exports = router;