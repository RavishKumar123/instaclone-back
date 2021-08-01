const mongoose = require("mongoose");

const brandUserSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    brand_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Brand"
    }
} , {
    timestamps: true
});

module.exports = mongoose.model("BrandUser" , brandUserSchema);