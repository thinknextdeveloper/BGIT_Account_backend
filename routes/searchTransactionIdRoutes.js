const express = require("express");
const router = express.Router();
const { findTransaction } = require("../controllers/searchTransactionIdController");

router.get("/find", findTransaction);

module.exports = router;
