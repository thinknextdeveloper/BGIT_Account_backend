const express = require("express");
const router = express.Router();
const {
  hostelNames, sessions, courses, batches, report, pendingReport,
} = require("../controllers/hostelReportController");

router.get("/hostel-names", hostelNames);
router.get("/sessions", sessions);
router.get("/courses", courses);
router.get("/batches", batches);
router.get("/report", report);
router.get("/pending-report", pendingReport);

module.exports = router;