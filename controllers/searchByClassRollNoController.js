const { searchStudentsByClassRollNo } = require("../models/searchByClassRollNoModel");

const findByClassRollNo = async (req, res) => {
  try {
    const { classRollNo, rollNo, college, collegeName, allColleges } = req.query;
    const term = classRollNo || rollNo;
    const selectedCollege = college || collegeName;
    const isAllColleges = allColleges === "true" || allColleges === true;

    if (!term || String(term).trim() === "") {
      return res.status(400).json({ success: false, message: "Please specify class roll No" });
    }

    if (!isAllColleges && !selectedCollege) {
      return res.status(400).json({ success: false, message: "Please Select College" });
    }

    if (isNaN(Number(term))) {
      return res.status(400).json({ success: false, message: "Class Roll No must be Numeric" });
    }

    const userColleges = req.user?.colleges ?? [];

    const rows = await searchStudentsByClassRollNo({
      classRollNo: term,
      collegeName: selectedCollege,
      allColleges: isAllColleges,
      userColleges,
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found", data: [] });
    }

    const sanitizedRows = rows.map((row) => {
      const copy = { ...row };
      if (copy.Snap) {
        if (Buffer.isBuffer(copy.Snap)) {
          copy.Snap = `data:image/jpeg;base64,${copy.Snap.toString("base64")}`;
        } else if (typeof copy.Snap === "object" && Array.isArray(copy.Snap.data)) {
          copy.Snap = `data:image/jpeg;base64,${Buffer.from(copy.Snap.data).toString("base64")}`;
        } else if (typeof copy.Snap === "string") {
          const trimmed = copy.Snap.trim();
          if (trimmed.startsWith("data:image") || trimmed.startsWith("http")) {
            copy.Snap = trimmed;
          } else if (trimmed.length > 20) {
            copy.Snap = `data:image/jpeg;base64,${trimmed}`;
          }
        }
      } else {
        copy.Snap = null;
      }
      return copy;
    });

    return res.status(200).json({ success: true, data: sanitizedRows });
  } catch (err) {
    console.error("searchByClassRollNo error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

module.exports = { findByClassRollNo };
