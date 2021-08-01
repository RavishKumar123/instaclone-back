const jwtStrategy = require("passport-jwt").Strategy;
const extractJwt = require("passport-jwt").ExtractJwt;
const mongoose = require("mongoose");

const Admin = mongoose.model("Admin");

const opts = {};
opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_ADMIN;

module.exports = (passport) => {
    passport.use("admin_role",new jwtStrategy(opts , (jwt_payload , done) => {
        Admin.aggregate([ { $project: {username: 1 , email: 1} } ]).then(user => {
            if(user){
                return done(null , {user:{...user[0],role:"admin"}});
            }else {
                return done(null , false);
            }
        }).catch(err => {
            console.log("Error: ",err);
        });
    }));
}