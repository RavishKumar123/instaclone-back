const jwtStrategy = require("passport-jwt").Strategy;
const extractJwt = require("passport-jwt").ExtractJwt;
const mongoose = require("mongoose");
const User = mongoose.model("User");

const opts = {};
opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_USER;

module.exports = (passport) => {
  passport.use(
    "user_role",
    new jwtStrategy(opts, (jwt_payload, done) => {
      console.log("check2 user");

      User.findById(jwt_payload.id)
        .then((user) => {
          if (user) {
            return done(null, {user:{...user[0],role:"admin"}});
          } else {
            return done(null, false);
          }
        })
        .catch((err) => {
          console.log("Error: ", err);
        });
    })
  );
};
