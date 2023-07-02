const db = require('../data/database');

const bcrypt = require('bcryptjs');

const mongoDb = require('mongodb');

class User {

    constructor(email, password, name, phnumber) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phnumber = phnumber;
    }

    getUserWithSameEmail() {
        return db.getDb().collection('users').findOne({ email: this.email })
    }

    async existsAlready() {
        const existingUser = await this.getUserWithSameEmail();
        if (existingUser) {
            return true;
        }
        return false;
    }

    async signup() {
        const hashedPassword = await bcrypt.hash(this.password, 12);

        await db.getDb().collection('users').insertOne({
            name: this.name,
            email: this.email,
            password: hashedPassword,
            phnumber: this.phnumber
        });
    }
    
    hasMatchingPassword(hashedPassword) {
        return bcrypt.compare(this.password, hashedPassword);
    }

    async returnMembers(members) {
        const listMembers = []
        for (const i of members) {
            const id = new mongoDb.ObjectId(i);
            var user = db.getDb().collection('users').findOne({_id: id});
            user = new User(user);
            listMembers.push(user);
        }
        
        return listMembers;
    }
}

module.exports = User;