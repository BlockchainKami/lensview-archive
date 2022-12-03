const mongoose = require("mongoose");
const { Schema, } = mongoose;

const comment = new Schema({
    url: String,
    publicationIDs: [String]
});

const Comment = mongoose.model("Comment", comment);
module.exports = { Comment };