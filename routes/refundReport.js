const express = require("express");
const router = express.Router();
const { ledgerNames, sessions, display, exportData } = require("../controllers/refundReportController");

router.get("/ledger-names", ledgerNames);
router.get("/sessions", sessions);
router.get("/display", display);
router.get("/export", exportData);

module.exports = router;