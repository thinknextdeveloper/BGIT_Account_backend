const express = require("express");
const router = express.Router();
const { display, totals } = require("../controllers/dayBookAllSubLedgersController");

router.get("/display", display);
router.get("/totals", totals);

module.exports = router;