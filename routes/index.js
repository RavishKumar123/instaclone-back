const express = require("express");
const adminRouter = require("./Admin.Routes");
const postRouter = require("./Posts.Routes");
const brandRouter = require("./Brand.Routes");
const userRouter = require("./User.Routes");
const emlRouter = require("./Eml.Routes");
const commentRouter = require("./Comment.Routes");
const authRouter = require("./Auth.Routes");
const notificationRouter = require("./Notification.Routes");
const apiRouter = express.Router();

apiRouter.use("/admin", adminRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/post", postRouter);
apiRouter.use("/brand", brandRouter);
apiRouter.use("/comment", commentRouter);
apiRouter.use("/eml", emlRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/notification", notificationRouter);

module.exports = apiRouter;
