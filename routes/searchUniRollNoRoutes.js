const express = require("express");
const router = express.Router();
const { findByUniRollNo } = require("../controllers/searchUniRollNoController");

router.get("/find", findByUniRollNo);
router.get("/students", findByUniRollNo);

module.exports = router;
