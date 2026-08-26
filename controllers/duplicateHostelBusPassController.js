const model = require("../models/duplicateHostelBusPassModel");

// Shared by both student panels — `student` is "1" or "2", used only for
// error messages; the actual DB lookups are identical either way.
const student = async (req, res) => {
  try {
    const { idNo } = req.query;
    if (!idNo) return res.status(400).json({ success: false, message: "Please specify ID No." });
    if (idNo.length !== 10) return res.status(400).json({ success: false, message: "Invalid ID No." });

    const admission = await model.getStudentByIdNo(idNo);
    if (!admission) {
      return res.status(404).json({ success: false, message: "ID No does not exists" });
    }

    const allowed = await model.entryAlreadyExist(admission.collegeName);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "This ID No does not belongs to your rights" });
    }

    const semesters = admission.facility === "None" ? [] : await model.getSemesters(idNo, admission.facility);
    const ledgerEntries = await model.getLedgerEntries(idNo, admission.collegeName);

    return res.status(200).json({ success: true, data: { admission, semesters, ledgerEntries } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const print = async (req, res) => {
  try {
    const { idNo1, idNo2, srNo1, srNo2, collegeName, facility } = req.query;

    if (!idNo1) return res.status(400).json({ success: false, message: "Please enter IDNo" });
    if (!srNo1) return res.status(400).json({ success: false, message: "Please enter SrNo" });
    if (!collegeName) return res.status(400).json({ success: false, message: "Please specify collegename" });

    const idNos = [idNo1, idNo2].filter(Boolean);
    const srNos = [srNo1, srNo2].filter(Boolean);

    const data = await model.getPrintData({ idNos, srNos, collegeName, facility });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No record found to print" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.code === "NO_TEMPLATE" || err.code === "NO_FACILITY") {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { student, print };