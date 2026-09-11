const express = require("express");
const router = express.Router();
const { findFacultyByIDNo } = require("../controllers/searchFacultyIdNoController");

router.get("/find", findFacultyByIDNo);

module.exports = router;
