const express = require("express");
const router = express.Router();
const {
  courses, batches, subHeads, display, singleSubHead,
} = require("../controllers/allSubLedgersPendingFeeController");

router.get("/courses", courses);
router.get("/batches", batches);
router.get("/sub-heads", subHeads);
router.get("/display", display);
router.get("/single-subhead", singleSubHead);

module.exports = router;