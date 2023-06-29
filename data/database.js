const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let database;

async function connectToDatabase() {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    // const client = await MongoClient.connect('mongodb+srv://sujithkumarbanda:savitriamma@cluster0.ru4lj0j.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true });
    database = client.db('store-users');
}

function getDb() {
    if(!database) {
        throw new Error("Connect the database!");
    }
    return database;
}

module.exports = {
    connectToDatabase: connectToDatabase,
    getDb: getDb
}