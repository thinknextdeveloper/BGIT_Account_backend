const { searchStudentsByName } = require("../models/searchNameModel");

const findStudents = async (req, res) => {
  try {
    const { name, studentName, college, collegeName, allColleges, searchType, exact } = req.query;
    const term = name || studentName;
    const selectedCollege = college || collegeName;
    const isAllColleges = allColleges === "true" || allColleges === true;
    const isExact = searchType === "exact" || exact === "true" || exact === true;

    if (!isAllColleges && !selectedCollege) {
      return res.status(400).json({ success: false, message: "Please specify college name" });
    }

    if (!term || String(term).trim() === "") {
      return res.status(400).json({ success: false, message: "Please specify student name" });
    }

    const userColleges = req.user?.colleges ?? [];

    const rows = await searchStudentsByName({
      studentName: term,
      collegeName: selectedCollege,
      allColleges: isAllColleges,
      searchType: isExact ? "exact" : "part",
      userColleges,
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No record found", data: [] });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("searchStudentsByName error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

module.exports = { findStudents };
