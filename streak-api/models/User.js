const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Calcutta',
    },
    streak_freezes_available: {
      type: Number,
      default: 2,
      min: 0,
    },
    expo_push_token: {
      type: String,
      default: null,
    },
    notification: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
