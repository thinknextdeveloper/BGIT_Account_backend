const express = require("express");
const router = express.Router();
const reservedReceiptController = require("../controllers/reservedReceiptController");

router.get("/ledgers", reservedReceiptController.getLedgers);
router.get("/colleges", reservedReceiptController.getColleges);
router.get("/next-from", reservedReceiptController.getNextReceiptFrom);
router.get("/", reservedReceiptController.getReservedReceipts);
router.post("/", reservedReceiptController.saveReservedReceipts);

module.exports = router;