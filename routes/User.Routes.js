const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const multer = require("multer");

const router = express.Router();
const {
  retrieveUser,
  updateProfile,
  changeAvatar,
  removeAvatar,
  bookmarkPost,
  retrieveFollowing,
  retrieveFollowers,
  followUser,
  followBrand,
  retriveBrand,
  searchUsers,
  retrieveSuggestedUsers
} = require("../controllers/User.Controller");
const { requireAuth, optionalAuth } = require("../controllers/Auth.Controller");
router.get("/:username", optionalAuth, retrieveUser);
router.put("/", requireAuth, updateProfile);
router.put(
  "/avatar",
  requireAuth,
  multer({
    dest: "temp/",
    limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
  }).single("image"),
  changeAvatar
);
router.delete("/avatar", requireAuth, removeAvatar);
router.post("/:postId/bookmark", requireAuth, bookmarkPost);
router.get("/:userId/:offset/following", requireAuth, retrieveFollowing);
router.get("/:userId/:offset/followers", requireAuth, retrieveFollowers);
router.post("/:userId/follow", requireAuth, followUser);
router.get("/brand/:brandId", optionalAuth, retriveBrand);
router.post("/branding/:brandId", requireAuth, followBrand);
router.get("/:username/:offset/search", searchUsers);
router.get('/suggested/:max?', requireAuth, retrieveSuggestedUsers);

module.exports = router;
