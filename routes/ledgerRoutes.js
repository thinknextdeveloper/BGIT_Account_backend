const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const ledgerController = require("../controllers/ledgerController");

// Protect all ledger routes with JWT token authentication
router.use(authenticateToken);

// Display records from MasterLedgers
router.get("/display", ledgerController.getLedgers);

// Add new record to MasterLedgers
router.post("/add", ledgerController.createLedger);

module.exports = router;
