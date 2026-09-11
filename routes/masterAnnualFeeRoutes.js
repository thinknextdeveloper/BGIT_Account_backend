const express = require("express");
const router = express.Router();
const { displayFeeStructure, saveFeeStructure, report } = require("../controllers/masterAnnualFeeController");

router.get("/display", displayFeeStructure);
router.post("/save", saveFeeStructure);
router.get("/report", report); // full unfiltered grid — frmMasterAnnualFeeReport

module.exports = router;