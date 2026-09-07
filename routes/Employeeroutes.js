const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeController");

// GET  /api/employees?idNo=123      -> find employee (btnFind)
// PUT  /api/employees                -> save changes (btnUpdate)
router.get("/", controller.getEmployee);
router.put("/", controller.updateEmployee);

// GET  /api/employees/masters/banks  -> bank dropdown list
// POST /api/employees/masters/banks  -> add a bank (the "..." dialog)
router.get("/masters/banks", controller.getBanks);
router.post("/masters/banks", controller.addBank);

module.exports = router;

/* Mount in your app entrypoint:
     const employeeRoutes = require("./routes/employeeRoutes");
     app.use("/api/employees", employeeRoutes);
*/