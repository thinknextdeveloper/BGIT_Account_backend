const express = require("express");
const router = express.Router();
const {
  courses, batches, semesters, sessions, subLedgerHeads, display, exportData,
} = require("../controllers/feeSubLedgerController");

router.get("/courses", courses);
router.get("/batches", batches);
router.get("/semesters", semesters);
router.get("/sessions", sessions);
router.get("/subledger-heads", subLedgerHeads);
router.get("/display", display);
router.get("/export", exportData);

module.exports = router;