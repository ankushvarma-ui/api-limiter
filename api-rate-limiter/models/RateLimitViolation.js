const mongoose = require("mongoose");

const rateLimitViolationSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  violationCount: {
    type: Number,
    default: 1,
  },
  firstViolation: {
    type: Date,
    default: Date.now,
  },
  lastViolation: {
    type: Date,
    default: Date.now,
  },
});

// TTL: auto-remove violations older than 24 hours
rateLimitViolationSchema.index(
  { lastViolation: 1 },
  { expireAfterSeconds: 86400 }
);

module.exports = mongoose.model("RateLimitViolation", rateLimitViolationSchema);
