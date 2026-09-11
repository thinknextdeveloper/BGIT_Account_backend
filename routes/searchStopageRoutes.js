const express = require("express");
const router = express.Router();
const { findStopage } = require("../controllers/searchStopageController");

router.get("/find", findStopage);

module.exports = router;
