const express = require("express");
const router = express.Router();
const { loginTypes, findStaff, photo, submit } = require("../controllers/assignRightsController");

router.get("/login-types", loginTypes);
router.get("/find", findStaff);
router.get("/photo/:idNo", photo);
router.post("/submit", submit);

module.exports = router;

// In app.js: app.use("/api/assign-rights", require("./routes/assignRightsRoutes"));