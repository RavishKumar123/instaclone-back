const User = require("../models/User.model");
const Reset = require("../models/Reset");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const jwt = require('jwt-simple');
const { sendEmail } = require("../services/Email");
const { validationResult } = require("express-validator");
const ObjectId = require("mongoose").Types.ObjectId;

exports.registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { name, bio, email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) return res.status(409).json({ message: "Email already exists." });
    const register = new User({ name, bio, email, password });
    const registerResponse = await register.save();
    console.log(registerResponse);
    const payload = {
      id: registerResponse._id,
      email: registerResponse.email,
      username: registerResponse.name,
    };
    jwt.sign(
      payload,
      process.env.SECRET_USER,
      { expiresIn: 30000000 },
      async (err, token) => {
        res.send({
          user: {
            email: registerResponse.email,
            name: registerResponse.name,
          },
          token: token,
        });
      }
    );
    // return res.status(200).json({ message: "User successfully registered." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, success: false });
  }
};
module.exports.verifyJwt = (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = jwt.decode(token, process.env.SECRET_USER).id;
      const user = await User.findOne({
        $or: [{ _id: id }],
      });
      if (user) {
        console.log("UPEr", user);
        return resolve({
          _id: user._id,
          email: user.email,
          name: user.name,
          avatar:
            "https://res.cloudinary.com/drwb19czo/image/upload/v1622032714/snalbi0iav1wxgowxb1f.png",
          disabled: user.disabled,
          bio: user.bio,
          email_verified: user.email_verified,
        });
      } else {
        reject("Not authorized.");
      }
    } catch (err) {
      return reject("Not authorized.");
    }
  });
};

exports.loginUser = async (req, res) => {
  const { authorization } = req.headers;
  const { email, password } = req.body;
  if (authorization) {
    try {
      const user = await this.verifyJwt(authorization);
      console.log(user);
      return res.send({
        user,
        token: authorization,
      });
    } catch (err) {
      return res.status(401).send({ message: err });
    }
  }
  if (!email || !password) {
    return res.status(400).send({
      message: "Please provide both a username/email and a password.",
    });
  }
  try {
    const user = await User.findOne({
      $or: [{ email: email }],
    });
    if (!user || !user.password) {
      return res.status(401).send({
        message:
          "The credentials you provided are incorrect, please try again.",
      });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return next(err);
      }
      if (!result) {
        return res.status(401).send({
          message:
            "The credentials you provided are incorrect, please try again.",
        });
      }
      const payload = {
        id: user._id,
        email: user.email,
        name: user.name,
      };
      jwt.sign(
        payload,
        process.env.SECRET_USER,
        { expiresIn: 30000000 },
        async (err, token) => {
          res.send({
            user: {
              _id: user._id,
              email: user.email,
              name: user.name,
              avatar:
                "https://res.cloudinary.com/drwb19czo/image/upload/v1622032714/snalbi0iav1wxgowxb1f.png",
              disabled: user.disabled,
              bio: user.bio,
              email_verified: user.email_verified,
            },
            token: token,
          });
        }
      );
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// exports.loginUser = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ message: errors.array() });
//     }
//     const { email, password } = req.body;
//     const user = await User.findOne({ email: email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "Email is not registered on the platform." });
//     }
//     if (user.disabled === false) {
//       return res.status(404).json({
//         message: "Your account is blocked or inactive. Please contact admin.",
//       });
//     }
//     bcrypt.compare(password, user.password).then((isMatch) => {
//       if (isMatch) {
//         const payload = {
//           id: user.id,
//           email: user.email,
//           username: user.name,
//         };
//         jwt.sign(
//           payload,
//           process.env.SECRET_USER,
//           { expiresIn: 30000000 },
//           async (err, token) => {
//             const data = await User.aggregate([
//               { $match: { email } },
//               {
//                 $project: {
//                   name: 1,
//                   bio: 1,
//                   email: 1,
//                   disabled: 1,
//                   email_verified: 1,
//                   following_id: 1,
//                   createdAt: 1,
//                   updatedAt: 1,
//                 },
//               },
//             ]);
//             return res
//               .status(200)
//               .json({ token: `Bearer ${token}`, success: true, data });
//           }
//         );
//       } else {
//         return res.status(401).json({ message: "Password is incorrect." });
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

exports.getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({ data: req.user });
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
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email is not registered on the platform." });
    }
    const code = Math.floor(10000 + Math.random() * 900000);
    const token = await Reset.findOne({ email: user.email });
    if (token) token.remove();
    const newToken = new Reset({
      email: user.email,
      code: code,
    });
    const savedToken = await newToken.save();
    await User.findOneAndUpdate({ _id: User._id }, { resetCode: code });
    await sendEmail(user.email, code);
    return res.status(200).json({
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
      return res.status(400).json({ message: "Passwords should match" });
    }
    const result = await Reset.findOne({ code: code });
    if (!result) {
      return res
        .status(400)
        .json({ message: "Invalid code Or your code may have expired" });
    }
    const user = await User.findOne({ email: result.email });
    // if (!AdminModel) {
    //     return res.status(400).json({ message: "User not found" });
    // }
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword)
      return res.status(400).json({
        message: "Please type new password which is not used earlier",
      });
    const salt = await bcrypt.genSalt(10);
    user.password = bcrypt.hashSync(password, salt);
    result.remove();
    await User.findOneAndUpdate(
      { email: result.email },
      { password: user.password }
    );
    return res.status(200).json({ message: "Password successfully updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const name = search ? { name: { $regex: `${search}`, $options: "i" } } : {};
    const data = await User.aggregate([
      { $match: { ...name } },
      {
        $project: {
          name: 1,
          bio: 1,
          email: 1,
          disabled: 1,
          email_verified: 1,
          following_id: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return res.status(200).json({ data: data });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    console.log("req.params.id: ", req.params.id);
    const data = await User.aggregate([
      { $match: { _id: ObjectId(req.params.id) } },
      {
        $project: {
          name: 1,
          bio: 1,
          email: 1,
          disabled: 1,
          email_verified: 1,
          following_id: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return res.status(200).json({ data: data });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.changeUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { id, disabled } = req.body;
    const data = await User.findOneAndUpdate(
      { _id: id },
      { disabled: disabled }
    );
    return res.status(200).json({
      message: disabled
        ? "Account successfully enabled"
        : "Account successfully disabled",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
