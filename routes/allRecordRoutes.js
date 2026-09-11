const express = require("express");
const router = express.Router();
const {
  colleges, courses, batches, feeCategories, sessions, display, exportExcel,
} = require("../controllers/allRecordController");

router.get("/colleges", colleges);
router.get("/courses", courses);
router.get("/batches", batches);
router.get("/fee-categories", feeCategories);
router.get("/sessions", sessions);
router.get("/display", display);
router.get("/export", exportExcel);

module.exports = router;