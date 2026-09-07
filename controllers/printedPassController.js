const passModel = require("../models/printedPassModel");

// Mirrors btnSave_Click -> insertintoprinthostelbuspass(txtIDNo.Text, txtidno1.Text)
// Called once per student slot from the client (Student 1 panel, Student 2 panel).
const save = async (req, res) => {
  try {
    const {
      type,
      idNo,
      studentName,
      collegeName,
      course,
      batch,
      semester,
      fatherName,
      facility,
      routeType,
      isFree,
      validMode,
      validUpTo,
      validFor,
      userName,
      force,
    } = req.body;

    if (!facility || (facility !== "Bus" && facility !== "Hostel")) {
      return res.status(400).json({ success: false, message: "Pls Select Facility between Bus/Hostel" });
    }
    if (!validMode) {
      return res.status(400).json({ success: false, message: "Pls Select Valid For Date" });
    }

    const result = await passModel.savePrintedPass({
      type,
      idNo,
      studentName,
      collegeName,
      course,
      batch,
      semester,
      fatherName,
      facility,
      routeType,
      isFree,
      validMode,
      validUpTo,
      validFor,
      userName,
      force,
    });

    if (result.status === "DUPLICATE") {
      return res.status(409).json({
        success: false,
        message: "Entry Already exist. Do you want to add duplicate entry?",
        data: { srNo: result.srNo, requiresConfirmation: true },
      });
    }

    return res.status(200).json({
      success: true,
      message:
        result.status === "CREATED"
          ? `Serial No. ${result.srNo} generated.`
          : `Serial No. ${result.srNo} updated.`,
      data: { srNo: result.srNo },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors btnUpdate1/2_Click -> Update(varidno)
const issueCard = async (req, res) => {
  try {
    const { type, idNo, validUpTo, force } = req.body;

    const result = await passModel.issueCard({ type, idNo, validUpTo });

    if (result.status === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: `ID No. ${idNo} does not exist` });
    }
    if (result.wasAlreadyIssued && !force) {
      return res.status(409).json({
        success: false,
        message: `Already card has been issued for ID No. ${idNo}. Do you want to issue it again?`,
        data: { requiresConfirmation: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Card has been issued successfully for ${idNo}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { save, issueCard };