const RequestLog = require("../models/RequestLog");
const BlockedIP = require("../models/BlockedIP");
const RateLimitViolation = require("../models/RateLimitViolation");
const User = require("../models/User");

// GET /protected-data  (requires JWT)
const getProtectedData = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted to protected resource.",
    data: {
      secretInfo: "This is sensitive data only available to authenticated users.",
      serverTime: new Date().toISOString(),
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
};

// GET /admin/logs  (requires JWT + admin role)
const getLogs = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.ip) filter.ip = req.query.ip;
    if (req.query.endpoint) filter.endpoint = new RegExp(req.query.endpoint, "i");
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      RequestLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      RequestLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/blocked-ips  (requires JWT + admin role)
const getBlockedIPs = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const blocked = await BlockedIP.find({ blockedUntil: { $gt: new Date() } }).sort({
      updatedAt: -1,
    });

    res.status(200).json({ success: true, count: blocked.length, data: blocked });
  } catch (err) {
    next(err);
  }
};

// DELETE /admin/blocked-ips/:ip  (requires JWT + admin role)
const unblockIP = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const ip = decodeURIComponent(req.params.ip);
    await BlockedIP.deleteOne({ ip });
    await RateLimitViolation.deleteOne({ ip });

    res.status(200).json({ success: true, message: `IP ${ip} has been unblocked.` });
  } catch (err) {
    next(err);
  }
};

// GET /admin/stats  (requires JWT + admin role)
const getStats = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last15min = new Date(now - 15 * 60 * 1000);

    const [
      totalRequests,
      requestsLast24h,
      rateLimitHits,
      blockedIPs,
      totalUsers,
      topIPs,
      topEndpoints,
    ] = await Promise.all([
      RequestLog.countDocuments(),
      RequestLog.countDocuments({ timestamp: { $gte: last24h } }),
      RequestLog.countDocuments({ statusCode: 429, timestamp: { $gte: last24h } }),
      BlockedIP.countDocuments({ blockedUntil: { $gt: now } }),
      User.countDocuments(),
      RequestLog.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        { $group: { _id: "$ip", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      RequestLog.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        { $group: { _id: "$endpoint", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        requestsLast24h,
        rateLimitHitsLast24h: rateLimitHits,
        currentlyBlockedIPs: blockedIPs,
        totalUsers,
        topIPs: topIPs.map((i) => ({ ip: i._id, requests: i.count })),
        topEndpoints: topEndpoints.map((e) => ({ endpoint: e._id, requests: e.count })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProtectedData, getLogs, getBlockedIPs, unblockIP, getStats };
