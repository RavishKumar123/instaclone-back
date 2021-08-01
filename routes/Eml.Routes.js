const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const router = express.Router();
const { parseEml } = require("../controllers/Eml.Controller");

router.post("/parse", (req , res) => { parseEml(req , res) });

module.exports = router;