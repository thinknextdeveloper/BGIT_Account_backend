const express = require("express");
const router = express.Router();
const {
  displayAll,
  display,
  addRow,
  editRow,
} = require("../controllers/masterHostelBusValidityController");

router.get("/display-all", displayAll);
router.get("/display", display);
router.post("/add", addRow);
router.put("/edit", editRow);

module.exports = router;