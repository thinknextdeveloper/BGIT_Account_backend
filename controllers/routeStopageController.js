const { getRouteStopageReport, getCollegeAddress } = require("../models/routeStopageModel");

const report = async (req, res) => {
  try {
    const { collegeName } = req.query;

    const rows = await getRouteStopageReport(collegeName || undefined);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found." });
    }

    let address = { addressLine1: "", addressLine2: "" };
    if (collegeName) {
      address = await getCollegeAddress(collegeName);
    }

    return res.status(200).json({
      success: true,
      data: {
        rows,
        collegeLabel: collegeName || "All Privileged Colleges",
        address,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { report };