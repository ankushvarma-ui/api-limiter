const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

/**
 * @route   POST /register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password }
 */
router.post("/register", register);

/**
 * @route   POST /login
 * @desc    Login and receive a JWT
 * @access  Public
 * @body    { email, password }
 */
router.post("/login", login);

module.exports = router;
