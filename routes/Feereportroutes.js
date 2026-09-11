const express = require("express");
const router = express.Router();

const { sessions, ledgerNames, report } = require("../controllers/feeReportController");

router.get("/sessions", sessions);
router.get("/ledger-names", ledgerNames);
router.get("/report", report);

module.exports = router;