const express = require("express");
const router = express.Router();

const {
  getColleges,
  getLedgerNamesForCollege,
  search,
  addToCancelled,
  listCancelled,
} = require("../controllers/cancelReceiptController");

router.get("/colleges", getColleges);
router.get("/ledger-names", getLedgerNamesForCollege);
router.get("/search", search);
router.post("/cancel", addToCancelled);
router.get("/cancelled-list", listCancelled);

module.exports = router;