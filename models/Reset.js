const mongoose = require("mongoose");

const resetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true
    }
} , {
    timestamps: true
});

module.exports = mongoose.model("Reset" , resetSchema);