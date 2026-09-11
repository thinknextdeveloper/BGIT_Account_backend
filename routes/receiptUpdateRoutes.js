const express = require("express");
const router = express.Router();
const {
  ledgerNames,
  bulkUpdate,
  multipleHeadReport,
  singleHeadReport,
} = require("../controllers/receiptUpdateController");

router.get("/ledgers", ledgerNames);
router.put("/bulk-update", bulkUpdate);
router.get("/multiple-head-report", multipleHeadReport);
router.get("/single-head-report", singleHeadReport);

module.exports = router;