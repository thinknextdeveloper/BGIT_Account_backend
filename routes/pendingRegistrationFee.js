const express = require("express");
const router = express.Router();
const { courses, batches, report } = require("../controllers/pendingRegistrationFeeController");

router.get("/courses", courses);
router.get("/batches", batches);
router.get("/report", report);

module.exports = router;