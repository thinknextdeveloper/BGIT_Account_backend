const express = require("express");
const router = express.Router();
const { findStudents } = require("../controllers/searchNameController");

router.get("/students", findStudents);
router.get("/find", findStudents);

module.exports = router;
