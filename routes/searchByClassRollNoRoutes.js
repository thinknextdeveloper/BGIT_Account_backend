const express = require("express");
const router = express.Router();
const { findByClassRollNo } = require("../controllers/searchByClassRollNoController");

router.get("/find", findByClassRollNo);
router.get("/students", findByClassRollNo);

module.exports = router;
