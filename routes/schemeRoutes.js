const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const schemeController = require("../controllers/schemeController");

// Protect all scheme routes with JWT token authentication
router.use(authenticateToken);

// Display records from MasterScheme
router.get("/display", schemeController.getSchemes);

// Add new record to MasterScheme
router.post("/add", schemeController.createScheme);

module.exports = router;
