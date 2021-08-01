const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const router = express.Router();
const {
  votePost,
  addPost,
  getPosts,
  getPost,
  removePost,
  getContent,
  retrievePostFeed,
  retrievePost,
  retrieveSuggestedPosts,
} = require("../controllers/Posts.Controller");
const { requireAuth, optionalAuth } = require("../controllers/Auth.Controller");

router.post(
  "/create",
  [
    passport.authenticate("admin_role", { session: false }),
    [
      body("email").isEmail().withMessage("Invalid email address"),
      body("subject").notEmpty().withMessage("subject field is required"),
      body("content").notEmpty().withMessage("content field is required"),
    ],
  ],
  (req, res) => {
    addPost(req, res);
  }
);

router.get(
  "/listing",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    getPosts(req, res);
  }
);

router.get(
  "/like/:postId",
  passport.authenticate("user_role", { session: false }),
  (req, res) => {
    votePost(req, res);
  }
);

// router.get(
//   "/:id",
//   (req, res) => {
//     getPost(req, res);
//   }
// );

router.get("/:postId", retrievePost);

router.get("/content/:id", (req, res) => {
  getContent(req, res);
});
// router.get("/content/:id", passport.authenticate("admin_role", { session: false }), (req , res) => { getContent(req , res) });

router.delete(
  "/:id",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    removePost(req, res);
  }
);
router.get("/suggested/:offset", retrieveSuggestedPosts);

router.get("/feed/:offset", optionalAuth, retrievePostFeed);
router.post("/:postId/vote", requireAuth, votePost);
module.exports = router;
