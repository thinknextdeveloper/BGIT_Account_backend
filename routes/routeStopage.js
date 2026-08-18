const express = require("express");
const router = express.Router();
const { report } = require("../controllers/routeStopageController");

router.get("/report", report);

module.exports = router;