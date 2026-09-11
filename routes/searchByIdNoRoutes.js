const express = require("express");
const router = express.Router();
const { findByIdNo } = require("../controllers/searchByIdNoController");

router.get("/find", findByIdNo);
router.get("/details", findByIdNo);

module.exports = router;
