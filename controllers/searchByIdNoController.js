const { getStudentDetailsByIdNo } = require("../models/searchByIdNoModel");

const findByIdNo = async (req, res) => {
  try {
    const { idNo, studentIdNo } = req.query;
    const term = idNo || studentIdNo;

    if (!term || String(term).trim() === "") {
      return res.status(400).json({ success: false, message: "Enter IDNo" });
    }

    if (isNaN(Number(term))) {
      return res.status(400).json({ success: false, message: "Enter Numeric value" });
    }

    const data = await getStudentDetailsByIdNo(term);
    if (!data || !data.admission) {
      return res.status(404).json({
        success: false,
        message: "Sorry! This IDNo has No Record Or May be IDNo is not valid.",
      });
    }

    // Permission check against userColleges if present
    const userColleges = req.user?.colleges ?? [];
    if (
      userColleges.length > 0 &&
      data.admission.CollegeName &&
      !userColleges.includes(data.admission.CollegeName)
    ) {
      return res.status(403).json({
        success: false,
        message: "This ID No does not belong to your rights.",
      });
    }

    // Sanitize Snap (base64 image)
    let snapBase64 = null;
    if (data.admission.Snap) {
      const snap = data.admission.Snap;
      if (Buffer.isBuffer(snap)) {
        snapBase64 = `data:image/jpeg;base64,${snap.toString("base64")}`;
      } else if (typeof snap === "object" && Array.isArray(snap.data)) {
        snapBase64 = `data:image/jpeg;base64,${Buffer.from(snap.data).toString("base64")}`;
      } else if (typeof snap === "string") {
        const trimmed = snap.trim();
        if (trimmed.startsWith("data:image") || trimmed.startsWith("http")) {
          snapBase64 = trimmed;
        } else if (trimmed.length > 20) {
          snapBase64 = `data:image/jpeg;base64,${trimmed}`;
        }
      }
    }
    data.admission.Snap = snapBase64;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("searchByIdNo error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

module.exports = { findByIdNo };
