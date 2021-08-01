const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
    content: {
        type: Number,
    }
} , {
    timestamps: true
});

module.exports = mongoose.model("Content" , contentSchema);