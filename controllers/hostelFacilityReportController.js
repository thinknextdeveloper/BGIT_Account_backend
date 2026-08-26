const { getHostelNames, getHostelFacilityReport } = require("../models/hostelFacilityReportModel");

const hostelNames = async (req, res) => {
  try {
    const data = await getHostelNames();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { collegeName, allColleges, hostelName } = req.query;
    const isAllColleges = allColleges === "true";

    if (!isAllColleges && !collegeName) {
      return res.status(400).json({ success: false, message: "Please Specify CollegeName" });
    }

    const rows = await getHostelFacilityReport({
      collegeName,
      allColleges: isAllColleges,
      hostelName: hostelName || undefined,
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found" });
    }

    return res.status(200).json({
      success: true,
      data: { rows, totalStudents: rows.length },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { hostelNames, report };