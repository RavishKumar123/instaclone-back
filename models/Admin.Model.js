const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    resetCode: { type: Number , default: 0}
});

adminSchema.pre("save" , function(next){
    const saltRounds = 10;
    if(this.modifiedPaths().includes("password")){
        bcrypt.genSalt(saltRounds , (err , salt) => {
            if(err) return next(err);
            bcrypt.hash(this.password , salt , (err , hash) => {
                this.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});

module.exports = mongoose.model("Admin" , adminSchema);