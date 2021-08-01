const jwtStrategy = require("passport-jwt").Strategy;
const extractJwt = require("passport-jwt").ExtractJwt;
const mongoose = require("mongoose");

const Admin = mongoose.model("Admin");
const User = mongoose.model("User");

const opts = {};
opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_ADMIN || process.env.SECRET_USER;

module.exports = (passport) => {
  passport.use(
    "check_token",
    new jwtStrategy(opts, (jwt_payload, done) => {
      console.log("check2 check");
      try {
        User.findById(jwt_payload.id)
          .then((user) => {
            console.log("In then");
            if (user) {
              return done(null, user);
            } else {
            }
          })
          .catch((err) => {
            console.log("In catch");

            //   User.findById(jwt_payload.id).then((user2) => {
            //     if (user2) {
            //       return done(null, user2);
            //     } else {
            //       return done(null, false);
            //     }
            //   });
          });
      } catch (e) {
        console.log("catch error");
      }
    })
  );
};
