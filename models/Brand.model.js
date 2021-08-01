const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    domain: {
      type: String,
    },
    affilate_link: {
      type: String,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

brandSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      //   const document = await User.findOne({
      //     $or: [{ email: this.email }, { username: this.username }],
      //   });
      //   if (document)
      //     return next(
      //       new RequestError(
      //         "A user with that email or username already exists.",
      //         400
      //       )
      //     );
      await mongoose.model("Brand-Followers").create({ brand: this._id });
    } catch (err) {
      return next((err.statusCode = 400));
    }
  }
});

module.exports = mongoose.model("Brand", brandSchema);
