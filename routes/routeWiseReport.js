const express = require("express");
const router = express.Router();
const { routes, report } = require("../controllers/routeWiseReportController");

router.get("/routes", routes);
router.get("/report", report);

module.exports = router;