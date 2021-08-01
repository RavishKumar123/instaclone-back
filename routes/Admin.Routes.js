const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getCurrentUser,
  recoverPassword,
  verifyCode,
  resetPassword,
  dashboard,
  getDashboardData,
  verifyToken,
} = require("../controllers/Admin.Controller");

router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Invalid email address"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("password field is required"),
  ],
  (req, res) => {
    registerAdmin(req, res);
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("password field is required"),
  ],
  (req, res) => {
    loginAdmin(req, res);
  }
);

router.get(
  "/current",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    getCurrentUser(req, res);
  }
);

router.get(
  "/verifyToken",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    verifyToken(req, res);
  }
);

router.get(
  "/dashboard",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    dashboard(req, res);
  }
);

router.get(
  "/dashboardData",
  passport.authenticate("admin_role", { session: false }),
  (req, res) => {
    getDashboardData(req, res);
  }
);

router.post(
  "/forget",
  [body("email").isEmail().withMessage("Invalid email address")],
  (req, res) => {
    recoverPassword(req, res);
  }
);

router.post(
  "/verify",
  [body("code").notEmpty().withMessage("code is required.")],
  (req, res) => {
    verifyCode(req, res);
  }
);

router.post(
  "/reset",
  [
    body("code").notEmpty().withMessage("code is required"),
    body("confirm_password")
      .notEmpty()
      .withMessage("confirm_password should match"),
    body("password").notEmpty().withMessage("password is required"),
  ],
  (req, res) => {
    resetPassword(req, res);
  }
);

module.exports = router;
