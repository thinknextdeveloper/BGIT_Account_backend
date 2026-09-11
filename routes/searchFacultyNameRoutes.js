const express = require("express");
const router = express.Router();
const { findFaculty } = require("../controllers/searchFacultyNameController");

router.get("/find", findFaculty);

module.exports = router;
