const express = require("express");
const router = express.Router();

// IMPORTANT: these names must exactly match what admissionFeeController.js
// exports at the bottom via module.exports. Your controller exports
// getAdmissionMetaOptions / updateAdmissionMeta (not getMetaOptions /
// updateMeta) — using the wrong names here is what caused:
//   "TypeError: argument handler must be a function"
const controller = require("../controllers/admissionFeeController");

const {
  findStudent,
  saveFee,
  getAdmissionMetaOptions,
  updateAdmissionMeta,
} = controller;

// --- Diagnostic guard ---------------------------------------------------
// Fails fast with a clear message instead of the opaque Express router
// error, if any handler name doesn't match what the controller exports.
const required = { findStudent, saveFee, getAdmissionMetaOptions, updateAdmissionMeta };
const missing = Object.entries(required)
  .filter(([, fn]) => typeof fn !== "function")
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(
    "admissionFeeRoutes: controller is missing (or not exporting as a function) these handlers:",
    missing
  );
  console.error(
    "admissionFeeController.js actually exports these keys:",
    Object.keys(controller)
  );
  throw new Error(
    `admissionFeeRoutes: cannot mount routes — missing handler(s): ${missing.join(", ")}. ` +
      `Check controllers/admissionFeeController.js's module.exports.`
  );
}
// -------------------------------------------------------------------------

// Order matters: static path before the dynamic /:idNo param
router.get("/meta-options", getAdmissionMetaOptions);

router.get("/:idNo", findStudent);
router.post("/:idNo/save", saveFee);
router.put("/:idNo/update", updateAdmissionMeta);

module.exports = router;

/**
 * Mount in your main app, e.g.:
 *   const admissionFeeRoutes = require("./routes/admissionFeeRoutes");
 *   app.use("/api/admission-fee", admissionFeeRoutes);
 */