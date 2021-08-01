const Brand = require("../models/Brand.model");
const Post = require("../models/Post.model");
const { validationResult } = require("express-validator");
const ObjectId = require("mongoose").Types.ObjectId;
const Following = require("../models/Following.model");
const BrandFollowers = require("../models/Brand-Followers.model");
module.exports.retriveBrand = async (req, res) => {
  console.log("Retriving brand profile");
  const { brandId } = req.params;

  try {
    const brand = await Brand.findOne(
      { _id: brandId },
      "name description domain affilate_link"
    );
    if (!brand) {
      return res
        .status(404)
        .send({ error: "Could not find a brand with that brand id." });
    }

    const posts = await Post.aggregate([
      {
        $facet: {
          data: [
            { $match: { brand_id: ObjectId(brandId) } },
            { $sort: { date: -1 } },
            { $limit: 12 },
            {
              $lookup: {
                from: "postvotes",
                localField: "_id",
                foreignField: "post",
                as: "postvotes",
              },
            },
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
              $unwind: "$postvotes",
            },
            {
              $addFields: { thumbnail: "$image" },
            },
            {
              $addFields: { author: "$brand_user_id" },
            },
            {
              $project: {
                comments: {
                  $sum: [{ $size: "$comments" }, { $size: "$commentReplies" }],
                },
                image: true,
                thumbnail: true,

                author: true,
                postVotes: { $size: "$postvotes.votes" },
              },
            },
          ],
          postCount: [
            { $match: { brand_id: ObjectId(brandId) } },
            { $count: "postCount" },
          ],
        },
      },
      { $unwind: "$postCount" },
      {
        $project: {
          data: true,
          postCount: "$postCount.postCount",
        },
      },
    ]);

    const followersDocument = await BrandFollowers.findOne({
      brandId: ObjectId(brandId),
    });

    // const followingDocument = await Following.findOne({
    //   user: ObjectId(user._id),
    // });

    return res.send({
      brand,
      followers: followersDocument.followers.length,
      following: 0,
      isFollowing: false,
      posts: posts[0],
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({});
    return res.status(200).json({ data: brands });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id })
      .populate("brand_id")
      .populate("brand_user_id");
    return res.status(200).json({ data: brand });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.editBrand = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const brand = await Brand.findOneAndUpdate(
      { _id: req.params.id },
      {
        affilate_link: req.body.affilate_link,
      }
    );
    return res
      .status(200)
      .json({ message: "Brand successfully updated", success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const posts = await Post.find({ brand_id: req.params.id });
    if (posts.length === 1) {
      const success = await Brand.deleteOne({ _id: req.params.id });
      return res.status(200).json({ message: "Brand successfully deleted" });
    }
    if (!posts.length > 0)
      return res.status(200).json({ message: "No Record Found" });
    return res.status(406).json({
      message: "Brand is associated with other post, It can't be deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
