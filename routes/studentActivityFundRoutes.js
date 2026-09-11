const express = require("express");
const router = express.Router();
const {
  courses, semesters, batches, currentSession, report,
} = require("../controllers/studentActivityFundController");

router.get("/courses", courses);
router.get("/semesters", semesters);
router.get("/batches", batches);
router.get("/current-session", currentSession);
router.get("/report", report);

module.exports = router;