const express = require("express");
const router = express.Router();
const { findByAddress } = require("../controllers/searchByAddressController");

router.get("/students", findByAddress); // ?address=&college=&allColleges=true|false

module.exports = router;