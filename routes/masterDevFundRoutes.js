const express = require("express");
const router = express.Router();
const { display, addRow, editRow } = require("../controllers/masterDevFundController");

router.get("/display", display);
router.post("/add", addRow);
router.put("/edit", editRow);

module.exports = router;