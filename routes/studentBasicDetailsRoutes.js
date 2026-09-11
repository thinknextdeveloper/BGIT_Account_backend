const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const studentBasicDetailsController = require("../controllers/studentBasicDetailsController");

// Protect all routes with JWT authentication
router.use(authenticateToken);

// Display records from Admissions
router.get("/display", studentBasicDetailsController.getStudentBasicDetails);

// Get distinct assigned colleges using existing GetCollege functionality
router.get("/colleges", studentBasicDetailsController.getColleges);

module.exports = router;
