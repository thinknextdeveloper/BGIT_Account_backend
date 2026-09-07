const model = require("../models/employeeModel");

/* ------------------------------------------------------------------ */
/*  Employee record — Find / Update                                    */
/* ------------------------------------------------------------------ */

// GET /api/employees?idNo=...
// Mirrors Display(): no record -> "Sorry no record found" (404).
const getEmployee = async (req, res) => {
  try {
    const { idNo } = req.query;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "Please specify Employee ID" });
    }

    const record = await model.getEmployeeByIdNo(idNo);
    if (!record) {
      return res.status(404).json({ success: false, message: "Sorry no record found" });
    }

    // Mirrors frmdebit.EntryAlreadyExist(txtCollege.Text) — the legacy app blocks
    // viewing a record that belongs to a college outside the logged-in user's rights.
    // Wire userHasAccessToCollege() to your real auth/session layer.
    if (!userHasAccessToCollege(req, record.CollegeName)) {
      return res.status(403).json({ success: false, message: "This ID No. does not belong to your rights." });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/employees
// Body: { idNo, ...fields }. Mirrors btnUpdate_Click: requires an ID and an
// already-found record before allowing the update.
const updateEmployee = async (req, res) => {
  try {
    const { idNo, ...fields } = req.body;

    if (!idNo) {
      return res.status(400).json({ success: false, message: "Please specify Employee ID" });
    }

    const updated = await model.updateEmployee(idNo, fields);
    if (!updated) {
      return res.status(404).json({ success: false, message: "No record found to update" });
    }

    const record = await model.getEmployeeByIdNo(idNo);
    return res.status(200).json({
      success: true,
      data: record,
      message: "Record has been updated successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  Bank master list — mirrors the dlgBank "..." dialog                 */
/* ------------------------------------------------------------------ */

const getBanks = async (_req, res) => {
  try {
    const data = await model.getBankNames();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addBank = async (req, res) => {
  try {
    const { bankName } = req.body;
    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ success: false, message: "Bank name is required" });
    }
    const saved = await model.addBankName(bankName.trim());
    return res.status(200).json({ success: true, data: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  Access control placeholder                                         */
/* ------------------------------------------------------------------ */

function userHasAccessToCollege(req, collegeName) {
  // No auth wired up yet -> allow. Replace with e.g.:
  //   return req.user?.collegeName === collegeName;
  if (!req.user || !req.user.collegeName) return true;
  return req.user.collegeName === collegeName;
}

module.exports = {
  getEmployee,
  updateEmployee,
  getBanks,
  addBank,
};