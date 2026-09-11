const express = require("express");
const router = express.Router();
const { listCategories, addCategory } = require("../controllers/masterCategoryController");

router.get("/", listCategories);
router.post("/", addCategory);

module.exports = router;