// routes/debitRoutes.js
const express = require("express");
const router = express.Router();

const {
  findStudent,
  saveDebit,
  getMetaOptions,
  getFeeHeads,        // add this
} = require("../controllers/debitController");

router.get("/meta-options", getMetaOptions);
router.get("/fee-heads", getFeeHeads);   // must come BEFORE "/:idNo"
router.post("/course/save", saveDebit); // must come BEFORE "/:idNo/save"
router.get("/:idNo", findStudent);
router.post("/:idNo/save", saveDebit);

module.exports = router;