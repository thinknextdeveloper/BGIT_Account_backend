const express = require("express");
const router = express.Router();
const {
  loginTypes,
  photo,
  findStaff,
  generatePassword,
} = require("../controllers/userManagementController");

router.get("/login-types", loginTypes);
router.get("/photo/:idNo", photo);
router.get("/find", findStaff);
router.post("/generate-password", generatePassword);

module.exports = router;

// In app.js: app.use("/api/user-management", require("./routes/userManagementRoutes"));