const mongoose = require("mongoose");

const brandRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    name: {
        type: String
    },
    domain: {
        type: String
    },
    approved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("BrandRequest" , brandRequestSchema);
