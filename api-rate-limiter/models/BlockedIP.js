const mongoose = require("mongoose");

const blockedIPSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  reason: {
    type: String,
    default: "Exceeded rate limit multiple times",
  },
  violationCount: {
    type: Number,
    default: 1,
  },
  blockedUntil: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL: auto-remove once blockedUntil passes
blockedIPSchema.index({ blockedUntil: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("BlockedIP", blockedIPSchema);
