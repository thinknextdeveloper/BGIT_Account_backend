const express = require("express");
const router = express.Router();
const { findReceipt } = require("../controllers/searchReceiptNoController");

router.get("/find", findReceipt);

module.exports = router;
