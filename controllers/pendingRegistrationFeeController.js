const { getCourses, getBatches, getPendingRegistrationFee } = require("../models/pendingRegistrationFeeModel");

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getCourses(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const batches = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getBatches(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { collegeName, course, batch } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Please Select College" });
    }

    const rows = await getPendingRegistrationFee({ collegeName, course, batch });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found" });
    }

    return res.status(200).json({ success: true, data: { rows, totalRecords: rows.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { courses, batches, report };