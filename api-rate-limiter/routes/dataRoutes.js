const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  getProtectedData,
  getLogs,
  getBlockedIPs,
  unblockIP,
  getStats,
} = require("../controllers/dataController");

/**
 * @route   GET /protected-data
 * @desc    Access protected resource (JWT required)
 * @access  Private
 */
router.get("/protected-data", authenticate, getProtectedData);

/**
 * @route   GET /admin/logs
 * @desc    View paginated request logs (admin only)
 * @access  Private/Admin
 * @query   ip, endpoint, from, to, page, limit
 */
router.get("/admin/logs", authenticate, getLogs);

/**
 * @route   GET /admin/blocked-ips
 * @desc    List currently blocked IPs (admin only)
 * @access  Private/Admin
 */
router.get("/admin/blocked-ips", authenticate, getBlockedIPs);

/**
 * @route   DELETE /admin/blocked-ips/:ip
 * @desc    Manually unblock an IP (admin only)
 * @access  Private/Admin
 */
router.delete("/admin/blocked-ips/:ip", authenticate, unblockIP);

/**
 * @route   GET /admin/stats
 * @desc    Aggregated traffic + abuse stats (admin only)
 * @access  Private/Admin
 */
router.get("/admin/stats", authenticate, getStats);

module.exports = router;
