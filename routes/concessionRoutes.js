const express = require("express");
const router = express.Router();
const { ledgerNames, batches, collegeAddress, report } = require("../controllers/concessionController");

router.get("/ledger-names", ledgerNames);
router.get("/batches", batches);
router.get("/college-address", collegeAddress);
router.get("/report", report);

module.exports = router;