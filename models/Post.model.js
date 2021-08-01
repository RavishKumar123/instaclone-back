const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new mongoose.Schema({
  domain: {
    type: String,
  },
  subject: {
    type: String,
  },
  email: {
    type: String,
  },
  owner_id: {
    type: String,
    default: "admin",
  },
  brand_id: {
    type: mongoose.Schema.ObjectId,
    ref: "Brand",
  },
  brand_user_id: {
    type: mongoose.Schema.ObjectId,
    ref: "BrandUser",
  },
  content: {
    type: mongoose.Schema.ObjectId,
    ref: "Content",
  },
  image: {
    type: String,
  },
  received_at: {
    type: Date,
  },
  thumbnail: String,
  caption: String,
  hashtags: [
    {
      type: String,
      lowercase: true,
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: Schema.ObjectId,
    ref: "BrandUser",
  },
});

PostSchema.pre("deleteOne", async function (next) {
  const postId = this.getQuery()["_id"];
  try {
    await mongoose.model("PostVote").deleteOne({ post: postId });
    await mongoose.model("Comment").deleteMany({ post: postId });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Post", PostSchema);
