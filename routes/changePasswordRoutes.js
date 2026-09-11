const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware"); // adjust path to wherever this file actually lives
const { submit } = require("../controllers/changePasswordController");

router.post("/submit", authenticateToken, submit);

module.exports = router;

// In app.js: app.use("/api/change-password", require("./routes/changePasswordRoutes"));