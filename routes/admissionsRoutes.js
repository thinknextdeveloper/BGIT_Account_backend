const express = require("express");
const router = express.Router();
const { display, updateStudentField } = require("../controllers/admissionsController");
const cancelRestoreController = require("../controllers/cancelRestoreController");

router.get("/display", display);
router.put("/update-field", updateStudentField);

// Fallback endpoints for cancel-restore mounted under /api/admissions
router.get("/cancel-restore-student", cancelRestoreController.displayStudentDetail);
router.post("/cancel-restore-student", cancelRestoreController.addCancelledAdmission);
router.get("/all-cancellations", cancelRestoreController.displayAllCancellation);
router.get("/courses-by-college", cancelRestoreController.getCoursesByCollege);
router.post("/add-cancelled-admission", cancelRestoreController.addCancelledAdmission);
router.post("/restore-admission", cancelRestoreController.restoreAdmission);

module.exports = router;