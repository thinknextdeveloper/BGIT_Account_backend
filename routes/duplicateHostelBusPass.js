const express = require("express");
const router = express.Router();
const { student, print } = require("../controllers/duplicateHostelBusPassController");

router.get("/student", student);
router.get("/print", print);

module.exports = router;