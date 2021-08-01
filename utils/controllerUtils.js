const Comment = require("../models/Comment.model");
const ObjectId = require("mongoose").Types.ObjectId;
const linkify = require("linkifyjs");
require("linkifyjs/plugins/mention")(linkify);
const socketHandler = require("../handlers/socketHandler");
const Notification = require("../models/Notification.model");
const User = require("../models/User.model");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");

module.exports.retrieveComments = async (postId, offset, exclude = 0) => {
  try {
    const commentsAggregation = await Comment.aggregate([
      {
        $facet: {
          comments: [
            { $match: { post: ObjectId(postId) } },
            // Sort the newest comments to the top
            { $sort: { date: -1 } },
            // Skip the comments we do not want
            // This is desireable in the even that a comment has been created
            // and stored locally, we'd not want duplicate comments
            { $skip: Number(exclude) },
            // Re-sort the comments to an ascending order
            { $sort: { date: 1 } },
            { $skip: Number(offset) },
            { $limit: 10 },
            {
              $lookup: {
                from: "commentreplies",
                localField: "_id",
                foreignField: "parentComment",
                as: "commentReplies",
              },
            },
            {
              $lookup: {
                from: "commentvotes",
                localField: "_id",
                foreignField: "comment",
                as: "commentVotes",
              },
            },
            { $unwind: "$commentVotes" },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author",
              },
            },
            { $unwind: "$author" },
            {
              $addFields: {
                commentReplies: { $size: "$commentReplies" },
                commentVotes: "$commentVotes.votes",
              },
            },
            {
              $unset: [
                "author.password",
                "author.email",
                "author.private",
                "author.bio",
                "author.bookmarks",
              ],
            },
          ],
          commentCount: [
            {
              $match: { post: ObjectId(postId) },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
        },
      },
      {
        $unwind: "$commentCount",
      },
      {
        $addFields: {
          commentCount: "$commentCount.count",
        },
      },
    ]);
    return commentsAggregation[0];
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * Sends a confirmation email to an email address
 * @function sendConfirmationEmail
 * @param {string} username The username of the user to send the email to
 * @param {string} email The email of the user to send the email to
 * @param {string} confirmationToken The token to use to confirm the email
 */
module.exports.sendConfirmationEmail = async (
  username,
  email,
  confirmationToken
) => {
  if (process.env.NODE_ENV === "production") {
    try {
      const source = fs.readFileSync(
        "templates/confirmationEmail.html",
        "utf8"
      );
      template = handlebars.compile(source);
      const html = template({
        username: username,
        confirmationUrl: `${process.env.HOME_URL}/confirm/${confirmationToken}`,
        url: process.env.HOME_URL,
      });
      await this.sendEmail(email, "Confirm your instaclone account", html);
    } catch (err) {
      console.log(err);
    }
  }
};

/**
 * Generates a unique username based on the base username
 * @function generateUniqueUsername
 * @param {string} baseUsername The first part of the username to add a random number to
 * @returns {string} Unique username
 */
module.exports.generateUniqueUsername = async (baseUsername) => {
  let uniqueUsername = undefined;
  try {
    while (!uniqueUsername) {
      const username = baseUsername + Math.floor(Math.random(1000) * 9999 + 1);
      const user = await User.findOne({ username });
      if (!user) {
        uniqueUsername = username;
      }
    }
    return uniqueUsername;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Formats a cloudinary thumbnail url with a specified size
 * @function formatCloudinaryUrl
 * @param {string} url The url to format
 * @param {size} number Desired size of the image
 * @return {string} Formatted url
 */
module.exports.formatCloudinaryUrl = (url, size, thumb) => {
  const splitUrl = url.split("upload/");
  splitUrl[0] += `upload/${
    size.y && size.z ? `x_${size.x},y_${size.y},` : ""
  }w_${size.width},h_${size.height}${thumb && ",c_thumb"}/`;
  const formattedUrl = splitUrl[0] + splitUrl[1];
  return formattedUrl;
};

/**
 * Sends a notification to the user when the user is mentioned
 * @function sendMentionNotification
 * @param {object} req The request object
 * @param {string} message The message sent by the user
 * @param {string} image Image of the post that was commented on
 * @param {object} post The post that was commented on
 * @param {object} user User who commented on the post
 */
module.exports.sendMentionNotification = (req, message, image, post, user) => {
  console.log("In send notification");
  const mentionedUsers = new Set();
  console.log("mentionedUsers", mentionedUsers);
  // Looping through every mention and sending a notification when necessary
  linkify.find(message).forEach(async (item) => {
    console.log(item.value !== `@${user.username}`);
    // Making sure a mention notification is not sent to the sender or the poster
    if (
      item.type === "mention" &&
      item.value !== `@${user.username}` &&
      // item.value !== `@${post.author.username}` &&
      // Making sure a mentioned user only gets one notification regardless
      // of how many times they are mentioned in one comment
      !mentionedUsers.has(item.value)
    ) {
      console.log("Item", item);
      mentionedUsers.add(item.value);
      // Finding the receiving user's id
      const receiverDocument = await User.findOne({
        username: item.value.split("@")[1],
      });
      console.log("In receiverDocument", receiverDocument);

      if (receiverDocument) {
        const notification = new Notification({
          sender: user._id,
          receiver: receiverDocument._id,
          notificationType: "mention",
          date: Date.now(),
          notificationData: {
            postId: post._id,
            image,
            message,
            filter: "",
          },
        });
        await notification.save();
        socketHandler.sendNotification(req, {
          ...notification.toObject(),
          sender: {
            _id: user._id,
            username: user.username,
            author: user.username,
          },
        });
      }
    }
  });
};

module.exports.populatePostsPipeline = [
  // {
  //   $lookup: {
  //     from: "brand",
  //     localField: "_id",
  //     foreignField: "brand_id",
  //     as: "author",
  //   },
  // },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "post",
      as: "comments",
    },
  },
  {
    $lookup: {
      from: "commentreplies",
      localField: "comments._id",
      foreignField: "parentComment",
      as: "commentReplies",
    },
  },
  {
    $lookup: {
      from: "postvotes",
      localField: "_id",
      foreignField: "post",
      as: "postVotes",
    },
  },
  {
    $unwind: "$postVotes",
  },
  // {
  //   $unwind: "$author",
  // },
  {
    $addFields: {
      comments: { $size: "$comments" },
      commentReplies: { $size: "$commentReplies" },
      postVotes: { $size: "$postVotes.votes" },
    },
  },
  {
    $addFields: { comments: { $add: ["$comments", "$commentReplies"] } },
  },
  {
    $unset: ["commentReplies"],
  },
];
