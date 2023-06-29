const Group = require('../models/group-model');

const db = require('../data/database');

const checkAuth = require('../middlewares/check-auth');

const mongoDb = require('mongodb');

const sessionFlash = require('../util/session-flash');

async function exploreGroups(req, res, next) {
    try{
        const groups = await Group.findAll();
        const uid = req.session.uid;
        // for(const group of groups) {
        //     const admin = group.admin;
        //     if (admin == uid) {
        //         console.log("ID matching");
        //     }
        //     else {
        //         console.log("Not matching");
        //     }
        // }
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
        res.render('groups/group-detail', { group: group, name: user.name, uid: req.session.uid });
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

module.exports = {
    exploreGroups: exploreGroups,
    createGroup: createGroup,
    createGroupPage: createGroupPage,
    getUpdateGroup: getUpdateGroup,
    updateGroup: updateGroup,
    getGroupDetails: getGroupDetails,
    deleteGroup: deleteGroup,
    searchGroup: searchGroup
}