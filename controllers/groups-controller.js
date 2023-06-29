const Group = require('../models/group-model');

const db = require('../data/database');

const checkAuth = require('../middlewares/check-auth');

const mongoDb = require('mongodb');

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
    res.render('groups/create-group', { uid: req.session.uid });
}

async function createGroup(req, res, next) {

    // console.log(req.body);
    // console.log(req.file.filename);

    const uid = req.session.uid;

    const group = new Group( { ...req.body, image: req.file.filename});
    
    try{
        await group.save();
    } catch(error) {
        next(error);
        return;
    }
   
    res.redirect('/');
}

async function getUpdateGroup(req, res, next) {
    try {
        const group = await Group.findById(req.params.id);

        res.render('groups/update-group', { group: group, uid: req.session.uid });
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

    try {
        await group.save();
    } catch (error) {
        next(error);
        return;
    }

    res.redirect('/groups');
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
    console.log(grpName);
    const group = await db.getDb().collection('groups').find( {name: grpName} );
    console.log(group);
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