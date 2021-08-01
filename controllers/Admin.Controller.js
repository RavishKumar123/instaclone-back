const Admin = require("../models/Admin.Model");
const User = require("../models/User.model");
const Brand = require("../models/Brand.model");
const BrandUser = require("../models/BrandUser.model");
const Post = require("../models/Post.model");
const Reset = require("../models/Reset");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../services/Email");
const { validationResult } = require("express-validator");
const AdminModel = require("../models/Admin.Model");

exports.registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { username, email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (admin)
      return res.status(409).json({ message: "Email already exists." });
    const register = new Admin({ username, email, password });
    await register.save();
    return res.status(200).json({ message: "Admin successfully registered." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email });
    // const admin = await Admin.aggregate([
    //     {$match: {email: email}},
    //     {$project: { username: 1, email: 1 }}
    // ])
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Email is not registered on the platform." });
    }
    bcrypt.compare(password, admin.password).then((isMatch) => {
      if (isMatch) {
        const payload = {
          id: admin.id,
          email: admin.email,
          username: admin.username,
        };
        jwt.sign(
          payload,
          process.env.SECRET_ADMIN,
          { expiresIn: 30000000 },
          (err, token) => {
            return res.status(200).json({
              token: `Bearer ${token}`,
              admin: {
                _id: admin._id,
                username: admin.username,
                email: admin.email,
              },
              success: true,
            });
          }
        );
      } else {
        return res.status(401).json({ message: "Password is incorrect." });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({ data: req.user });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const brandCount = await Brand.countDocuments();
    const postCount = await Post.countDocuments();
    const userCount = await User.countDocuments();
    const brandUser = await BrandUser.countDocuments();
    const recentBrands = await Brand.find().sort({ updatedAt: -1 }).limit(8);
    const recentPosts = await Post.find().sort({ updatedAt: -1 }).limit(8);

    return res.status(200).json({
      success: true,
      brandUser: brandUser,
      user: userCount,
      post: postCount,
      brand: brandCount,
      topBrands: recentBrands,
      topPosts: recentPosts,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.recoverPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Email is not registered on the platform.",
      });
    }
    const code = Math.floor(10000 + Math.random() * 900000);
    const token = await Reset.findOne({ email: admin.email });
    if (token) token.remove();
    const newToken = new Reset({
      email: admin.email,
      code: code,
    });
    const savedToken = await newToken.save();
    await Admin.findOneAndUpdate({ _id: admin._id }, { resetCode: code });
    await sendEmail(admin.email, code);
    return res.status(200).json({
      success: true,
      message: "Password recovery code successfully sent to your email",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.verifyCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { code } = req.body;
    const success = await Reset.findOne({ code: code });
    if (!success) {
      return res.status(400).json({
        message: "This code is not valid. OR Your code may have expired.",
      });
    }
    return res.status(200).json({
      message: "Code verified successfully, please set your new password",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { confirm_password, password, code } = req.body;
    if (confirm_password !== password) {
      return res
        .status(200)
        .json({ message: "Passwords should match", success: false });
    }
    const result = await Reset.findOne({ code: code });
    if (!result) {
      return res.status(200).json({
        message: "Invalid code Or your code may have expired",
        success: false,
      });
    }
    const admin = await Admin.findOne({ email: result.email });
    if (!AdminModel) {
      return res
        .status(200)
        .json({ message: "User not found", success: false });
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (validPassword)
      return res.status(200).json({
        message: "Please type new password which is not used earlier",
        success: false,
      });
    const salt = await bcrypt.genSalt(10);
    admin.password = bcrypt.hashSync(password, salt);
    result.remove();
    await Admin.findOneAndUpdate(
      { email: result.email },
      { password: admin.password }
    );
    return res
      .status(200)
      .json({ message: "Password successfully updated", success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const usersCount = await User.countDocuments({});
    const brandsCount = await Brand.countDocuments({});
    const brandUsersCount = await BrandUser.countDocuments({});
    const postsCount = await Post.countDocuments({});
    const posts = await Post.find().sort({ createdAt: -1 }).limit(10);
    const brands = await Brand.find().sort({ createdAt: -1 }).limit(10);
    return res.status(200).json({
      usersCount,
      brandsCount,
      brandUsersCount,
      postsCount,
      posts,
      brands,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
