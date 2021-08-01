const Post = require("../models/Post.model");
const PostVotes = require("../models/PostVote.model");
const Brand = require("../models/Brand.model");
const Following = require("../models/Following.model");
const BrandUser = require("../models/BrandUser.model");
const Content = require("../models/Content.model");
const { validationResult } = require("express-validator");
const {
  retrieveComments,
  populatePostsPipeline,
} = require("../utils/controllerUtils");
const fs = require("fs");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

module.exports.retrievePost = async (req, res, next) => {
  console.log("POD");
  const { postId } = req.params;
  // console.log("Post if",postId);
  try {
    // Retrieve the post and the post's votes
    const post = await Post.aggregate([
      { $match: { _id: ObjectId(postId) } },
      {
        $lookup: {
          from: "postvotes",
          localField: "_id",
          foreignField: "post",
          as: "postVotes",
        },
      },
      // {
      //   $lookup: {
      //     from: "brand",
      //     localField: "_id",
      //     foreignField: "brand_id",
      //     as: "brand",
      //   },
      // },
      // { $unwind: "$brand" },
      { $unwind: "$postVotes" },
      // // {
      // //   $unset: [
      // //     "author.password",
      // //     "author.email",
      // //     "author.private",
      // //     "author.bio",
      // //     "author.githubId",
      // //   ],
      // // },
      {
        $addFields: { postVotes: "$postVotes.votes" },
      },
    ]);
    if (post.length === 0) {
      return res
        .status(404)
        .send({ error: "Could not find a post with that id." });
    }
    // Retrieve the comments associated with the post aswell as the comment's replies and votes
    const comments = await retrieveComments(postId, 0);
    const brand = await Brand.findOne({ _id: post[0].brand_id });
    return res.send({ ...post[0], commentData: comments, brand: brand });
  } catch (err) {
    next(err);
  }
};
exports.addPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { subject, email, content, image, received_at } = req.body;
    const strEmail = email.split("@");
    const strDomain1 = strEmail[1].split(".")[0];
    const strDomain2 = strEmail[1].split(".")[1];
    console.log(strEmail, strDomain1, strDomain2);
    var strDomain = "";
    if (!strDomain2.includes("com")) {
      strDomain = strDomain1 + "-" + strDomain2;
    } else {
      strDomain = strDomain1;
    }
    console.log("STR", strDomain);
    const brand = await Brand.findOne({ domain: strEmail[1] });
    const brand_user = await BrandUser.findOne({ name: strEmail[0], email });
    if (!brand) {
      const newBrand = new Brand({
        domain: strEmail[1],
        name: strDomain,
        description: "",
        affilate_link: "",
      });
      const success = await newBrand.save();
      if (!brand_user) {
        const newBrandUser = new BrandUser({
          name: strEmail[0],
          email: email,
          brand_id: success._id,
        });
        const successBrandUser = await newBrandUser.save();
        const post = new Post({
          domain: strDomain,
          subject,
          email,
          brand_id: success._id,
          brand_user_id: successBrandUser._id,
          content,
          image: "",
          received_at,
        });
        const postSuccess = await post.save();
        const postVote = new PostVotes({
          post: postSuccess._id,
        });
        await postVote.save();
        return res.status(200).json({
          ...post.toObject(),
          postVotes: [],
          comments: [],
          author: { avatar: "", name: successBrandUser.name },
        });
      }
    }
    if (!brand_user) {
      const newBrandUser = new BrandUser({
        name: strEmail[0],
        email: email,
        brand_id: brand._id,
      });
      const successBrandUser = await newBrandUser.save();
      const post = new Post({
        domain: strDomain,
        subject,
        email,
        brand_id: brand._id,
        brand_user_id: successBrandUser._id,
        content,
        image: "",
        received_at,
      });
      const postSuccess = await post.save();
      const postVote = new PostVotes({
        post: postSuccess._id,
      });
      await postVote.save();
      return res.status(200).json({
        ...post.toObject(),
        postVotes: [],
        comments: [],
        author: { avatar: "", name: successBrandUser.name },
      });
    }
    const post = new Post({
      domain: strDomain,
      subject,
      email,
      brand_id: brand._id,
      brand_user_id: brand_user._id,
      content,
      image: "",
      received_at,
    });
    const postSuccess = await post.save();
    const postVote = new PostVotes({
      post: postSuccess._id,
    });
    await postVote.save();
    return res.status(200).json({
      ...post.toObject(),
      postVotes: [],
      comments: [],
      author: { avatar: "", name: brand_user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { search } = req.query;
    const domain = search
      ? { domain: { $regex: `${search}`, $options: "i" } }
      : {};
    const posts = await Post.find({ ...domain })
      .populate("brand_id")
      .populate("brand_user_id");
    return res.status(200).json({ data: posts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.aggregate([
      { $match: { _id: ObjectId(id) } },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "post",
          as: "postVotes",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand_id",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $lookup: {
          from: "brandusers",
          localField: "brand_user_id",
          foreignField: "_id",
          as: "brandUser",
        },
      },
      { $unwind: "$brand" },
      { $unwind: "$postVotes" },
      {
        $addFields: { postVotes: "$postVotes.votes" },
      },
    ]);
    const comments = await retrieveComments(id, 0);
    // const post = await Post.findOne({ _id: req.params.id }).populate("brand_id").populate("brand_user_id");
    return res
      .status(200)
      .json({ data: { ...post[0], commentData: comments } });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.retrievePostFeed = async (req, res, next) => {
  const { offset } = req.params;
  const user = res.locals.user;
  console.log(user);
  if (user) {
    const followingDocument = await Following.findOne({ user: user._id });
    if (!followingDocument) {
      return res.status(404).send({ error: "Could not find any posts." });
    }
    const following = followingDocument.followingBrand.map(
      (following) => following.brand
    );
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [{ brand_id: { $in: following } }],
        },
      },
      { $sort: { updatedAt: -1 } },
      { $skip: Number(offset) },
      { $limit: 5 },
      {
        $lookup: {
          from: "brands",
          localField: "brand_id",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $lookup: {
          from: "brandusers",
          localField: "brand_user_id",
          foreignField: "_id",
          as: "brandUser",
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
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              // Finding comments related to the postId
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 3 },
            // Populating the author field
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author",
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
            {
              $unwind: "$author",
            },
            {
              $unwind: {
                path: "$commentVotes",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                commentVotes: "$commentVotes.votes",
              },
            },
          ],
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "commentCount",
        },
      },
      {
        $unwind: {
          path: "$commentCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $unwind: "$brand" },
      { $unwind: "$postVotes" },
      // {
      //   $unwind: "$author",
      // },
      {
        $addFields: {
          postVotes: "$postVotes.votes",
          commentData: {
            comments: "$comments",
            commentCount: "$commentCount.count",
          },
        },
      },
      {
        $unset: ["comments", "commentCount"],
      },
    ]);
    return res.send(posts);
  } else {
    try {
      const posts = await Post.aggregate([
        { $match: {} },
        { $sort: { date: -1 } },
        { $skip: Number(offset) },
        { $limit: 5 },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $lookup: {
            from: "brandusers",
            localField: "brand_user_id",
            foreignField: "_id",
            as: "brandUser",
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
          $lookup: {
            from: "comments",
            let: { postId: "$_id" },
            pipeline: [
              {
                // Finding comments related to the postId
                $match: {
                  $expr: {
                    $eq: ["$post", "$$postId"],
                  },
                },
              },
              { $sort: { date: -1 } },
              { $limit: 3 },
              // Populating the author field
              {
                $lookup: {
                  from: "users",
                  localField: "author",
                  foreignField: "_id",
                  as: "author",
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
              {
                $unwind: "$author",
              },
              {
                $unwind: {
                  path: "$commentVotes",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  commentVotes: "$commentVotes.votes",
                },
              },
            ],
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "comments",
            let: { postId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$post", "$$postId"],
                  },
                },
              },
              {
                $group: { _id: null, count: { $sum: 1 } },
              },
              {
                $project: {
                  _id: false,
                },
              },
            ],
            as: "commentCount",
          },
        },
        {
          $unwind: {
            path: "$commentCount",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $unwind: "$brand" },
        { $unwind: "$postVotes" },
        // {
        //   $unwind: "$author",
        // },
        {
          $addFields: {
            postVotes: "$postVotes.votes",
            commentData: {
              comments: "$comments",
              commentCount: "$commentCount.count",
            },
          },
        },
        {
          $unset: ["comments", "commentCount"],
        },
      ]);
      return res.send(posts);
    } catch (error) {
      return res.status(500).json({ message: error.message, success: false });
    }
  }
};

exports.getContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findOne({ _id: id });
    const data = fs.readFileSync(`./contents/${content.content}.txt`, "utf8");
    // const fileContents = new Buffer(req.body.buf, 'base64')
    // fs.writeFile("text", fileContents, (err) => {
    //     if (err) return console.error(err)
    //     console.log('file saved to ', part.filename)
    // })

    return res.status(200).json({ data: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.removePost = async (req, res) => {
  try {
    const { id } = req.params;
    // const post = await Post.aggregate([
    //   { $match: { _id: ObjectId(id) } },
    //   {
    //     $lookup: {
    //       from: "votes",
    //       localField: "_id",
    //       foreignField: "post",
    //       as: "postVotes",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "brands",
    //       localField: "brand_id",
    //       foreignField: "_id",
    //       as: "brand",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "brandusers",
    //       localField: "brand_user_id",
    //       foreignField: "_id",
    //       as: "brandUser",
    //     },
    //   },
    //   { $unwind: "$brand" },
    //   { $unwind: "$postVotes" },
    //   {
    //     $addFields: { postVotes: "$postVotes.votes" },
    //   },
    // ]);
    const post = await Post.findOne({ _id: id });
    console.log("POST", JSON.stringify(post));
    const brandUser = await Post.find({ brand_user_id: post.brand_user_id });
    const brand = await Post.find({ brand_id: post.brand_id });

    if (brand.length == 1) {
      await BrandUser.deleteOne({ _id: post.brand_user_id });
      await Brand.deleteOne({ _id: post.brand_id });
      await Post.deleteOne({ _id: id });
      return res.status(200).json({
        message: "Post and brand and brand user successfully deleted",
      });
    } else {
      if (brandUser.length == 1) {
        await BrandUser.deleteOne({ _id: post.brand_user_id });
        await Post.deleteOne({ _id: req.params.id });
        return res
          .status(200)
          .json({ message: "Post and branduser successfully deleted" });
      } else {
        await Post.deleteOne({ _id: req.params.id });
        return res.status(200).json({ message: "Post successfully deleted" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

module.exports.votePost = async (req, res, next) => {
  const { postId } = req.params;
  const user = res.locals.user;
  try {
    // Update the vote array if the user has not already liked the post
    const postLikeUpdate = await PostVotes.updateOne(
      { post: postId, "votes.author": { $ne: user._id } },
      {
        $push: { votes: { author: user._id } },
      }
    );
    if (!postLikeUpdate.nModified) {
      if (!postLikeUpdate.ok) {
        return res.status(500).send({ error: "Could not vote on the post." });
      }
      // Nothing was modified in the previous query meaning that the user has already liked the post
      // Remove the user's like
      const postDislikeUpdate = await PostVotes.updateOne(
        { post: postId },
        { $pull: { votes: { author: user._id } } }
      );

      if (!postDislikeUpdate.nModified) {
        return res.status(500).send({ error: "Could not vote on the post." });
      }
    } else {
      // Sending a like notification
      // const post = await Post.findById(postId);
      // if (String(post.author) !== String(user._id)) {
      //   // Create thumbnail link
      //   const image = formatCloudinaryUrl(
      //     post.image,
      //     {
      //       height: 50,
      //       width: 50,
      //     },
      //     true
      //   );
      //   const notification = new Notification({
      //     sender: user._id,
      //     receiver: post.author,
      //     notificationType: "like",
      //     date: Date.now(),
      //     notificationData: {
      //       postId,
      //       image,
      //       filter: post.filter,
      //     },
      //   });
      //   await notification.save();
      //   socketHandler.sendNotification(req, {
      //     ...notification.toObject(),
      //     sender: {
      //       _id: user._id,
      //       username: user.username,
      //       avatar: user.avatar,
      //     },
      //   });
      // }
    }
    return res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.retrieveSuggestedPosts = async (req, res, next) => {
  const { offset = 0 } = req.params;

  try {
    const posts = await Post.aggregate([
      {
        $sort: { date: -1 },
      },
      {
        $skip: Number(offset),
      },
      {
        $limit: 20,
      },
      {
        $sample: { size: 20 },
      },
      ...populatePostsPipeline,
    ]);
    console.log("posts", posts);
    return res.send(posts);
  } catch (err) {
    next(err);
  }
};
