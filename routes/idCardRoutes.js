const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const controller = require("../controllers/idCardController");

router.get("/display", controller.display);
router.get("/valid-upto", controller.getValidUpTo);
router.post("/update-card", controller.updateCard);
router.post("/save-image", upload.single("image"), controller.saveImage);
router.get("/print", controller.getPrintPayload);

module.exports = router;