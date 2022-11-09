require('dotenv').config();
const mongoose = require('mongoose');


function connectDB() {
    //database Connection
    mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true});
    const connection = mongoose.connection;

    connection.once('open', () => {
        console.log('Database Connected.');
    }).on('error', function (err) {
        console.log('connection failed.');
    })
}
module.exports = connectDB;