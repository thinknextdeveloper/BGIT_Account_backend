const express = require("express");
const router = express.Router();
const { report, semesters, feeCategories } = require("../controllers/ledgerStatusController");

router.post("/report", report); // POST because feeCategories[] + many filters
router.get("/semesters", semesters);
router.get("/fee-categories", feeCategories);

module.exports = router;