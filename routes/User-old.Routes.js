const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const router = express.Router();
const { 
    registerUser , 
    loginUser , 
    getCurrentUser , 
    recoverPassword , 
    verifyCode , 
    resetPassword ,
    getAllUsers ,
    getUserDetails , 
    changeUserStatus,
    retrieveUser
} = require("../controllers/User.Controller");

router.post("/register", [
    body("name").notEmpty().withMessage('Name field is required'),
    body("email").isEmail().withMessage('Invalid email address'),
    body("password").notEmpty().withMessage("Password field is required"),
    body("bio").notEmpty().withMessage("Bio field is required"),
], (req , res) => { registerUser(req , res) });

router.post("/login", [
    body("email").isEmail().withMessage('Invalid email address'),
    body("password").notEmpty().withMessage("password field is required")
], (req , res) => { loginUser(req , res); });

router.get("/current" , passport.authenticate("user_role", { session: false }) , (req , res) => {
    getCurrentUser(req , res);
});

router.get("/all" , passport.authenticate("admin_role", { session: false }) , (req , res) => {
    getAllUsers(req , res);
});

router.post("/status", [ passport.authenticate("admin_role", { session: false }), [
    body("id").notEmpty().withMessage("user id is required"),
    body("disabled").notEmpty().withMessage("status is required").isBoolean().withMessage("Disabled field must be true or false."),
]], (req ,res) => { changeUserStatus(req ,res); });

router.post("/forget", [
    body("email").isEmail().withMessage('Invalid email address')
], (req ,res) => { recoverPassword(req ,res); });

router.post("/verify", [
    body("code").notEmpty().withMessage("code is required.")
], (req ,res) => { verifyCode(req ,res); });

router.post("/reset", [
    body("code").notEmpty().withMessage("code is required"),
    body("confirm_password").notEmpty().withMessage("confirm_password should match"),
    body("password").notEmpty().withMessage("password is required")
], (req ,res) => { resetPassword(req , res); });

// router.get("/:id" , passport.authenticate("admin_role", { session: false }) , (req , res) => {
//     getUserDetails(req , res);
// });

router.get("/:id" , (req , res) => {
    retrieveUser(req , res);
});

module.exports = router;