const db = require('../data/database');

var mongodb = require('mongodb');

const checkAuth = require('../middlewares/check-auth');

// const uid = checkAuth.returnUid;

class Group {
    constructor(groupData) {
        this.location = groupData.location;
        this.name = groupData.name;
        this.subject = groupData.subject;
        this.description = groupData.description;
        this.uid = groupData.uid;
        this.admin = groupData.admin;
        this.image = groupData.image;
        this.members = [];
        this.announcements = [];
        this.studymaterial = [];
        this.updateImageData();
        if(groupData._id) {
            this.id = groupData._id.toString();
        }
    }

    static async findById(groupId) {
        let grpId;
        try {
             grpId = new mongodb.ObjectId(groupId); 
        } catch (error) {
            error.code = 404;
            throw error;
        }

        const group = await db.getDb().collection('groups').findOne({_id: grpId});
        
        if(!group) {
            const error = new Error('Could not find group with provided ID');
            error.code = 404;
            throw error;
        }

        return new Group(group);
    }

    static async findAll() {
        const groups = await db.getDb().collection('groups').find().toArray();

        return groups.map(function(group) {
            return new Group(group);
        });
    }

    static async findForAdmin() {
        const groups = await db.getDb().collection('groups').find().toArray();

        return groups;
    }

    updateImageData() {
        this.imagePath = `group-data/images/${this.image}`;
        this.imageUrl = `/groups/assets/images/${this.image}`;
    }

    async save() {
        const groupData = {
            location: this.location,
            name: this.name,
            subject: this.subject,
            description: this.description,
            admin: this.uid,
            members: this.members,
            announcements: this.announcements,
            blogs: [],
            studyMaterial: [],
            image: this.image
        };

        if(this.id) {
            const groupId = new mongodb.ObjectId(this.id);

            if (!this.image) {
                delete groupData.image;
            }

            await db.getDb().collection('groups').updateOne({_id: groupId}, {
                $set: groupData
            }
            );
        } else {
            await db.getDb().collection('groups').insertOne(groupData);
        }
    }

    async replaceImage(newImage) {
        this.image = newImage;
        this.updateImageData();
    }

}

module.exports = Group;