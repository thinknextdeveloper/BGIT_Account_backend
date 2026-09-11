const express = require("express");
const router = express.Router();
const {
  courses,
  batches,
  sessions,
  display,
  displayPendingFeeOnly,
} = require("../controllers/ledgerwiseStatusController");

router.get("/courses", courses);
router.get("/batches", batches);
router.get("/sessions", sessions);
router.get("/display", display);
router.get("/pending-fee", displayPendingFeeOnly);

module.exports = router;    