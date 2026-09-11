const express = require("express");
const router = express.Router();
const { listSchemes, addScheme } = require("../controllers/masterSchemeController");

router.get("/", listSchemes);
router.post("/", addScheme);

module.exports = router;