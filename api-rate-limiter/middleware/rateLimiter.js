const RequestLog = require("../models/RequestLog");
const BlockedIP = require("../models/BlockedIP");
const RateLimitViolation = require("../models/RateLimitViolation");

// In-memory sliding window store
const requestCounts = new Map();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const ABUSE_THRESHOLD = parseInt(process.env.ABUSE_BLOCK_THRESHOLD) || 3;
const BLOCK_DURATION_MS =
  parseInt(process.env.ABUSE_BLOCK_DURATION_MS) || 60 * 60 * 1000;

function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

async function logRequest(req, statusCode) {
  try {
    await RequestLog.create({
      ip: getClientIP(req),
      endpoint: req.originalUrl || req.url,
      method: req.method,
      userId: req.user?._id || null,
      statusCode,
      userAgent: req.headers["user-agent"] || "",
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Log write error:", err.message);
  }
}

const rateLimiter = async (req, res, next) => {
  const ip = getClientIP(req);
  const now = Date.now();

  // 1. Check if IP is currently blocked
  try {
    const blocked = await BlockedIP.findOne({
      ip,
      blockedUntil: { $gt: new Date() },
    });

    if (blocked) {
      await logRequest(req, 403);
      const retryAfter = Math.ceil((blocked.blockedUntil - now) / 1000 / 60);
      return res.status(403).json({
        success: false,
        message: "Your IP has been temporarily blocked due to repeated abuse.",
        reason: blocked.reason,
        retryAfterMinutes: retryAfter,
        blockedUntil: blocked.blockedUntil,
      });
    }
  } catch (err) {
    console.error("Block check error:", err.message);
  }

  // 2. In-memory sliding window rate limit
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 0, windowStart: now });
  }

  const record = requestCounts.get(ip);

  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count += 1;

  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  const resetTime = new Date(record.windowStart + WINDOW_MS);

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", resetTime.toISOString());

  if (record.count > MAX_REQUESTS) {
    await logRequest(req, 429);

    // 3. Record violation and potentially block IP
    try {
      const violation = await RateLimitViolation.findOneAndUpdate(
        { ip },
        {
          $inc: { violationCount: 1 },
          $set: { lastViolation: new Date() },
          $setOnInsert: { firstViolation: new Date() },
        },
        { upsert: true, new: true }
      );

      if (violation.violationCount >= ABUSE_THRESHOLD) {
        const blockedUntil = new Date(now + BLOCK_DURATION_MS);
        await BlockedIP.findOneAndUpdate(
          { ip },
          {
            $set: {
              blockedUntil,
              reason: `Rate limit exceeded ${violation.violationCount} times`,
              updatedAt: new Date(),
            },
            $inc: { violationCount: 1 },
          },
          { upsert: true }
        );

        return res.status(429).json({
          success: false,
          message: "Too many requests",
          detail:
            "Your IP has been blocked due to repeated rate limit violations.",
          blockedUntil,
          retryAfterMinutes: Math.ceil(BLOCK_DURATION_MS / 1000 / 60),
        });
      }
    } catch (err) {
      console.error("Violation tracking error:", err.message);
    }

    return res.status(429).json({
      success: false,
      message: "Too many requests",
      detail: `Rate limit of ${MAX_REQUESTS} requests per ${WINDOW_MS / 60000} minutes exceeded.`,
      retryAfter: resetTime,
    });
  }

  // 4. Log successful request after response
  res.on("finish", () => {
    logRequest(req, res.statusCode);
  });

  next();
};

module.exports = rateLimiter;
