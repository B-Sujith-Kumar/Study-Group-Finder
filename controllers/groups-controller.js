const Group = require('../models/group-model');

const User = require('../models/user-model');

const db = require('../data/database');

const checkAuth = require('../middlewares/check-auth');

const mongoDb = require('mongodb');

const sessionFlash = require('../util/session-flash');

async function exploreGroups(req, res, next) {
    try{
        const groups = await Group.findAll();
        const uid = req.session.uid;
        res.render('groups/explore-groups', {groups: groups, id: uid});
    } catch (error) {
        next(error);
        return;
    }
}

function createGroupPage(req, res) {
    let sessionData = sessionFlash.getSessionData(req);

    if(!sessionData) {
        sessionData = {
            location: '',
            name: '',
            subject: '',
            description: ''
        }
    }
    res.render('groups/create-group', { uid: req.session.uid, inputData: sessionData });
}

async function createGroup(req, res, next) {

    // console.log(req.body);
    // console.log(req.file.filename);

    const uid = req.session.uid;

    const group = new Group( { ...req.body, image: req.file.filename});

    let allGroups = await db.getDb().collection('groups').findOne({ name: group.name });


    const sessionErrorData = {
        errorMessage: 'A group with this name already exists. Try a different name!',
        location: group.location,
        name: group.name,
        subject: group.subject,
        description: group.description
    }

    if(!allGroups) {
        try{
            await group.save();
        } catch(error) {
            next(error);
            return;
        }
        res.redirect('/groups');
        return;
    }

    sessionFlash.flashDataToSession(req, sessionErrorData, function() {
        res.redirect('/groups/create');
    })
    return;

}

async function getUpdateGroup(req, res, next) {
    let sessionData = sessionFlash.getSessionData(req);

    if(!sessionData) {
        sessionData = {
            location: '',
            name: '',
            subject: '',
            description: ''
        }
    }
    try {
        const group = await Group.findById(req.params.id);

        res.render('groups/update-group', { group: group, uid: req.session.uid, inputData: sessionData });
    } catch (error) {
        next(error);
    }
}

async function updateGroup(req, res, next) {
    const group = new Group({
        ...req.body,
        _id: req.params.id,
    });

    if(req.file) {
        group.replaceImage(req.file.filename);
    }

    let prevName = await db.getDb().collection('groups').findOne( {_id: new mongoDb.ObjectId(req.params.id)} );

    let allGroups = await db.getDb().collection('groups').findOne({ name: group.name });

    const sessionErrorData = {
        errorMessage: 'A group with this name already exists. Try a different name!',
        location: group.location,
        name: group.name,
        subject: group.subject,
        description: group.description
    }

    if(allGroups && group.name === prevName.name) {
        try {
            await group.save();
        } catch (error) {
            next(error);
            return;
        }
    
        res.redirect('/groups');
        return;
    }
    
    sessionFlash.flashDataToSession(req, sessionErrorData, function() {
        res.redirect('/groups/edit/' + req.params.id);
    })

}

async function getGroupDetails(req, res, next) {
    try {
        const group = await Group.findById(req.params.id);
        const admin = new mongoDb.ObjectId(group.admin);
        const user = await db.getDb().collection('users').findOne({_id: admin});
        const groupForMembers = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});
        let isMember = false;
        const members = groupForMembers.members;
        for (const i of members) {
            if (i === req.session.uid) {
                isMember = true;
                break;
            }
        }

        const groupFind = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});
        console.log(groupFind);
        const studyMaterial = groupFind.studyMaterial;
        console.log(studyMaterial);

        if (studyMaterial.length != 0) {
            for (const i of studyMaterial) {
                i.id = i._id.toString();
            }
        }


        res.render('groups/group-detail', { group: group, name: user.name, uid: req.session.uid, isMember: isMember, studyMaterial: studyMaterial, groupId: groupFind._id.toString()});
    } catch( error ) {
        next(error);
        return;
    }
}

async function deleteGroup(req, res, next) {
    try{
        const group = await Group.findById(req.params.id);
        await db.getDb().collection('groups').deleteOne({_id: new mongoDb.ObjectId(group.id)});
        const groups = await Group.findAll();
        const uid = req.session.uid;
        res.render('groups/explore-groups', {groups: groups, id: uid});
    } catch (error) {
        next(error);
        return;
    }
}

async function searchGroup(req, res, next) {
    let grpName = req.body.search;
    grpName = grpName;
    let group = await db.getDb().collection('groups').findOne( {name: grpName} );

    if(!group) {
        res.render('shared/failed-search');
        return;
    }

    group = new Group(group);
    const uid = req.session.uid;
    res.render('groups/search-group', {group: group, id: uid});
}

async function getYourGroups(req, res, next) {
    let id = req.params.id;
    let allGroups = await db.getDb().collection('groups').find({'admin': id}).toArray();
    let memberGroup = await db.getDb().collection('groups').find(
        {members: {$elemMatch: {$eq: req.session.uid} } }).toArray();

    let arrayOfGroups = [];
    let arrayOfGroups2 = [];

    for(let i in allGroups) {
        const grp = new Group(allGroups[i]);
        arrayOfGroups.push(grp);
    }
    
    if (memberGroup.length != 0) {
        for (let i in memberGroup) {
            const grp = new Group(memberGroup[i]);
            arrayOfGroups2.push(grp);
        }
    }


    res.render('users/your-groups', {id: req.session.uid, groups: arrayOfGroups, member: arrayOfGroups2});
}

async function joinGroup(req, res, next) {
    const group = await Group.findById(req.params.id);
    const admin = new mongoDb.ObjectId(group.admin);
    const user = await db.getDb().collection('users').findOne({_id: admin});
    const grpId = new mongoDb.ObjectId(req.params.id);
    let groupForMembers = await db.getDb().collection('groups').findOne({_id: grpId});
    await db.getDb().collection('groups').updateOne({_id: grpId}, { $push: {members: req.session.uid}} );
    res.redirect('/groups/' + req.params.id);
}

async function leaveGroup(req, res, next) {
    const id = new mongoDb.ObjectId(req.params.id);
    const group = await db.getDb().collection('groups').findOne({_id: id});
    await db.getDb().collection('groups').updateOne({_id: id}, {$pull: {members: req.session.uid}});
    res.redirect('/groups/' + req.params.id);
}

async function viewMembers(req, res, next) {
    const id = new mongoDb.ObjectId(req.params.id);
    const group = await db.getDb().collection('groups').findOne({_id: id});
    const members = group.members;
    const membersList = [];

    for (const i of members) {
        const uid = new mongoDb.ObjectId(i);
        const user = await db.getDb().collection('users').findOne({_id: uid});
        membersList.push(user);
    }

    for(const i of membersList) {
        i.grpId = req.params.id;
        i.userId = i._id.toString();
    }

    res.render('groups/view-members', {membersList: membersList, uid: req.session.uid, admin: group.admin});
}

async function removeMember(req, res, next) {
    const grpId = new mongoDb.ObjectId(req.params.grpId);
    const userId = req.params.userId;
    const group = await db.getDb().collection('groups').updateOne({_id: grpId}, {$pull: {members: userId}});
    res.redirect('/groups/' + req.params.grpId);
}

async function getCreateAnnouncement(req, res, next) {
    const group = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});
    res.render('groups/announcement', {group: group, id: group._id.toString()});
}

async function createAnnouncement(req, res, next) {
    const group = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});

    const announcementData = {
        _id: new mongoDb.ObjectId(),
        title: req.body.title,
        content: req.body.content
    }

    await db.getDb().collection('groups').updateOne(
        {_id: new mongoDb.ObjectId(req.params.id)},
        {$push: {announcements: announcementData}}
        );


    res.redirect('/groups/' + req.params.id);
}

async function viewAnnouncements(req, res, next) {
    const id = new mongoDb.ObjectId(req.params.id);
    const group = await db.getDb().collection('groups').findOne({_id: id});
    const announcement = group.announcements;
    for (const i in announcement) {
        announcement[i].id = announcement[i]._id.toString();
        console.log(announcement[i]);
    }
    res.render('groups/view-announcements', {
        announcement: announcement, group: group, uid: req.session.uid, groupId: req.params.id
    });
}

async function deleteAnnouncement(req, res, next) {
    const groupId = new mongoDb.ObjectId(req.params.grpId);
    const announcementId = new mongoDb.ObjectId(req.params.id);

    await db.getDb().collection('groups').updateOne(
        {_id: groupId}, {$pull: {announcements: {_id: announcementId}}
    });

    res.redirect('/groups/' + req.params.grpId);
}

async function getCreateBlog(req, res, next) {
    const group = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});
    res.render('groups/create-blog', {group: group, id: group._id.toString()});
}


async function createBlog(req, res, next) {
    const group = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});

    const blogData = {
        _id: new mongoDb.ObjectId(),
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        comments: []
    }

    await db.getDb().collection('groups').updateOne(
        {_id: new mongoDb.ObjectId(req.params.id)},
        {$push: {blogs: blogData}}
        );


    res.redirect('/groups/' + req.params.id);
}

async function viewBlogs(req, res, next) {
    const id = new mongoDb.ObjectId(req.params.id);
    const group = await db.getDb().collection('groups').findOne({_id: id});
    const blogs = group.blogs;
    for (const i in blogs) {
        blogs[i].id = blogs[i]._id.toString();
    }

    var admin = group.admin;

    admin = await db.getDb().collection('users').findOne({_id: new mongoDb.ObjectId(admin)});

    res.render('groups/blog-list', {
        blogs: blogs, group: group, uid: req.session.uid, groupId: req.params.id, admin: admin
    });
}

async function viewFullBlog(req, res, next) {
    const id = new mongoDb.ObjectId(req.params.id);
    const group = await db.getDb().collection('groups').findOne({blogs: {$elemMatch: {_id: id}}});
    const blogs = group.blogs;
    var reqBlog;
    for (const i in blogs) {
        if(blogs[i]._id.toString() === req.params.id) {
            reqBlog = blogs[i];
            reqBlog.id = blogs[i]._id.toString();
            break;
        }
    }

    var admin = group.admin;

    admin = await db.getDb().collection('users').findOne({_id: new mongoDb.ObjectId(admin)});

    const user = await db.getDb().collection('users').findOne({_id: new mongoDb.ObjectId(req.session.uid)});

    for(const i of reqBlog.comments) {
        const userid = new mongoDb.ObjectId(i.user);
        const user = await db.getDb().collection('users').findOne({_id: userid});
        i.name = user.name;
        i.id = i._id.toString();
    }

    res.render('groups/view-full-blog', {
        blogs: blogs, group: group, uid: req.session.uid, groupId: req.params.grpId, admin: admin, blog: reqBlog,
        user: user, comments: reqBlog.comments
    });
}

async function deleteBlog(req, res, next) {
    const groupId = new mongoDb.ObjectId(req.params.grpId);
    const blogId = new mongoDb.ObjectId(req.params.id);

    console.log(groupId);
    console.log(blogId);

    await db.getDb().collection('groups').updateOne(
        {_id: groupId}, {$pull: {blogs: {_id: blogId}}
    });

    res.redirect('/groups/' + req.params.grpId);
}

async function addComment(req, res, next) {
    const groupId = new mongoDb.ObjectId(req.params.grpId);
    const blogId = new mongoDb.ObjectId(req.params.id);

    const comment = req.body.comment;

    var user = new mongoDb.ObjectId(req.session.uid);
    user = await db.getDb().collection('users').findOne({_id: user});
    
    const commentData = {
        _id: new mongoDb.ObjectId(),
        user: req.session.uid,
        comment: comment
    }

    const group = await db.getDb().collection('groups').findOne({_id: groupId});
    const blogs = group.blogs;
    var index = -1;

    for (const i in blogs) {
        if (blogId.toString() == blogs[i]._id.toString()) {
            index = i;
            break;
        }
    }

    await db.getDb().collection('groups').updateOne({_id: groupId}, 
        { $push: {['blogs.' + index + '.comments']: commentData}});


    res.redirect('/groups/' + req.params.grpId + '/view-blog/' + req.params.id);
}

async function deleteComment(req, res, next) {
    const grpId = new mongoDb.ObjectId(req.params.grpId);
    const blogId = new mongoDb.ObjectId(req.params.id);
    const commentId = new mongoDb.ObjectId(req.params.cmntId);

    const group = await db.getDb().collection('groups').findOne({_id: grpId});
    const blogs = group.blogs;

    var outerIndex;
    var innerIndex;

    for (const i in blogs) {
        if (blogId.toString() == blogs[i]._id.toString()) {
            for (const j in blogs[i].comments) {
                if (commentId.toString() == blogs[i].comments[j]._id.toString()) {
                    outerIndex = i;
                    innerIndex = j;
                    break;
                }
            }
        }
    }

    console.log(outerIndex)
    console.log(innerIndex);

    console.log(commentId);

    await db.getDb().collection('groups').updateOne({_id: grpId},
        {$pull: {['blogs.' + outerIndex + '.comments']: {_id: commentId}}});
    
    res.redirect('/groups/' + grpId.toString() + '/view-blog/' + blogId.toString());
}

async function getAddMaterial(req, res, next) {
    const group = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});
    res.render('groups/add-study-material', {group: group, id: group._id.toString()});
}

async function addMaterial(req, res, next) {
    const group = await db.getDb().collection('groups').findOne({_id: new mongoDb.ObjectId(req.params.id)});

    const materialData = {
        _id: new mongoDb.ObjectId(),
        title: req.body.title,
        about: req.body.about,
        link: req.body.link,
    }

    await db.getDb().collection('groups').updateOne(
        {_id: new mongoDb.ObjectId(req.params.id)},
        {$push: {studyMaterial: materialData}}
        );

    res.redirect('/groups/' + req.params.id);
}

async function deleteMaterial(req, res, next) {
    const groupId = new mongoDb.ObjectId(req.params.grpId);
    const materialId = new mongoDb.ObjectId(req.params.id);

    await db.getDb().collection('groups').updateOne(
        {_id: groupId}, {$pull: {studyMaterial: {_id: materialId}}
    });

    res.redirect('/groups/' + req.params.grpId);
}

module.exports = {
    exploreGroups: exploreGroups,
    createGroup: createGroup,
    createGroupPage: createGroupPage,
    getUpdateGroup: getUpdateGroup,
    updateGroup: updateGroup,
    getGroupDetails: getGroupDetails,
    deleteGroup: deleteGroup,
    searchGroup: searchGroup,
    getYourGroups: getYourGroups,
    joinGroup: joinGroup,
    leaveGroup: leaveGroup,
    viewMembers: viewMembers, 
    removeMember: removeMember,
    getCreateAnnouncement: getCreateAnnouncement,
    createAnnouncement: createAnnouncement,
    viewAnnouncements: viewAnnouncements,
    deleteAnnouncement: deleteAnnouncement,
    getCreateBlog: getCreateBlog,
    createBlog: createBlog,
    viewBlogs: viewBlogs,
    viewFullBlog: viewFullBlog,
    deleteBlog: deleteBlog,
    addComment: addComment,
    deleteComment: deleteComment,
    getAddMaterial: getAddMaterial,
    addMaterial: addMaterial,
    deleteMaterial: deleteMaterial
}