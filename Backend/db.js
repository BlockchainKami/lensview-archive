require('dotenv').config();

const mongoose = require('mongoose')

const DATABASE_URL = process.env.DATABASE_URL

const connectDB = () => {
    mongoose.connect(DATABASE_URL, {useUnifiedTopology: true, useNewUrlParser: true}, err => {
        if(err) {
            console.error('Connect to DB failed')
            return false
        } else {
            console.log('Connection to DB successful')
        }
    })
    return true
}

const db = mongoose.connection

db.on('error', console.error.bind(console, "MongoDB connection failed"));

module.exports = {connectDB}