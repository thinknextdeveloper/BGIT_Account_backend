const express = require("express");
const router = express.Router();
const cancelRestoreController = require("../controllers/cancelRestoreController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/display-student", authenticateToken, cancelRestoreController.displayStudentDetail);
router.post("/display-student", authenticateToken, cancelRestoreController.addCancelledAdmission);
router.get("/all-cancellations", authenticateToken, cancelRestoreController.displayAllCancellation);
router.get("/courses-by-college", authenticateToken, cancelRestoreController.getCoursesByCollege);
router.post("/add-cancelled-admission", authenticateToken, cancelRestoreController.addCancelledAdmission);
router.post("/restore-admission", authenticateToken, cancelRestoreController.restoreAdmission);

module.exports = router;


