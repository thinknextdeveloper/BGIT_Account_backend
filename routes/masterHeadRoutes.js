const express = require("express");
const router = express.Router();
const masterHeadController = require("../controllers/masterHeadController");

router.get("/", masterHeadController.getMasterHeads);
router.get("/colleges", masterHeadController.getColleges);
router.post("/", masterHeadController.createMasterHead);
router.put("/", masterHeadController.updateMasterHead);
router.delete("/", masterHeadController.deleteMasterHead);

module.exports = router;