const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const feeSingleHeadController = require("../controllers/feeSingleHeadController");

// Protect all routes with JWT authentication middleware
router.use(authenticateToken);

// Display student fee details by IDNo (supports multiple endpoint paths)
router.get("/", feeSingleHeadController.getStudentFeeDetails);
router.get("/display", feeSingleHeadController.getStudentFeeDetails);
router.get("/find", feeSingleHeadController.getStudentFeeDetails);
// Helper endpoints for Payment Modes, Banks, Ledgers, and ReceiptNo
router.get("/banks", feeSingleHeadController.getBanks);
router.post("/banks", feeSingleHeadController.createBank);
router.get("/ledgers", feeSingleHeadController.getLedgers);
router.get("/receipt-no", feeSingleHeadController.getReceiptNo);
router.get("/semesters", feeSingleHeadController.getSemesters);
router.get("/search-receipt", feeSingleHeadController.searchReceipt);
router.post("/save", feeSingleHeadController.saveFeeEntry);
router.get("/all-cancellations", feeSingleHeadController.displayAllCancellation);

module.exports = router;
