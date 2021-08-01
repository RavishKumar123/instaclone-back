const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowersSchema = new Schema({
  brand: {
    type: Schema.ObjectId,
    ref: 'Brand'
  },
  followers: [
    {
      user: {
        type: Schema.ObjectId,
        ref: 'User'
      }
    }
  ]
});

const followersModel = mongoose.model('Brand-Followers', FollowersSchema);
module.exports = followersModel;
