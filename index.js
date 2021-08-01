const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const socketio = require("socket.io");
const passport = require("passport");
const session = require("express-session");
const connectDb = require("./config/db");
const jwt = require('jwt-simple');

require("dotenv").config();

const apiRouter = require("./routes");

const app = express();
const PORT = process.env.PORT || 9001;
app.use(express.json({ limit: "50mb" }));
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
connectDb();
app.use("/api", apiRouter);

app.use(
  session({
    secret: "roundcircle",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./config/Passport")(passport);
require("./config/PassportCheck")(passport);
require("./config/PassportAdmin")(passport);

app.get("/images/:name", (req, res) => {
  res.sendFile(path.join(__dirname, `./images/${req.params.name}`));
});

app.use((err, req, res, next) => {
  console.log("err",err.message);
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  if (err.name === "MulterError") {
    if (err.message === "File too large") {
      return res
        .status(400)
        .send({ error: "Your file exceeds the limit of 10MB." });
    }
  }
  res.status(err.statusCode || 500).send({
    error:
      err.statusCode >= 500
        ? "An unexpected error ocurred, please try again later."
        : err.message,
  });
});
const expressServer = app.listen(PORT, () => {
  console.log(`Server is listening to PORT: ${PORT}`);
});

const io = socketio(expressServer);
app.set('socketio', io);
console.log('Socket.io listening for connections');

// Authenticate before establishing a socket connection
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  console.log("Token",token);
  if (token) {
    try {
      const user = jwt.decode(token, process.env.JWT_SECRET);
      console.log("user",user);
      if (!user) {
        return next(new Error('Not authorized.'));
      }
      socket.user = user;
      return next();
    } catch (err) {
      next(err);
    }
  } else {
    return next(new Error('Not authorized.'));
  }
}).on('connection', (socket) => {
  socket.join(socket.user.id);
  console.log('socket connected:', socket.id);
});

