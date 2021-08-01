const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const router = express.Router();
const {
  getBrands,
  getBrand,
  editBrand,
  deleteBrand,
  retriveBrand,
} = require("../controllers/Brand.Controller");

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
router.get("/front/:brandId", (req, res) => {
  retriveBrand(req, res);
});
router.get(
  "/",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    getBrands(req, res);
  }
);

router.get(
  "/:id",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    getBrand(req, res);
  }
);

router.delete(
  "/:id",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    deleteBrand(req, res);
  }
);

router.put(
  "/:id",
  [
    passport.authenticate("admin_role", { session: false }),
    [
      body("affilate_link")
        .notEmpty()
        .withMessage("Affilate link field is required"),
    ],
  ],
  (req, res) => {
    editBrand(req, res);
  }
);

module.exports = router;
