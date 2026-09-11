const express = require("express");
const router = express.Router();

const {
  getDayBookOptions,
  getEntries,
  getLedgerWise,
} = require("../controllers/dayBookController");

router.get("/options", getDayBookOptions);
router.get("/entries", getEntries);
router.get("/ledger-wise-summary", getLedgerWise);

module.exports = router;