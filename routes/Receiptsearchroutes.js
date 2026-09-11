const express = require("express");
const router = express.Router();
const {
  ledgersByCollege,
  sessions,
  duplicateReceipt,
} = require("../controllers/Receiptsearchcontroller ");

router.get("/ledgers", ledgersByCollege); // ?college=
router.get("/sessions", sessions);
router.get("/receipt", duplicateReceipt); // ?college=&ledger=&session=&receiptNo=&searchType=

module.exports = router;