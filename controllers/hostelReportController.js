const {
  getHostelNames,
  getSessions,
  getCoursesForCollege,
  getBatchesForCollege,
  getHostelReport,
  getHostelPendingReport,
} = require("../models/hostelReportModel");

const hostelNames = async (req, res) => {
  try {
    const names = await getHostelNames();
    return res.status(200).json({ success: true, data: names });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sessions = async (req, res) => {
  try {
    const data = await getSessions();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getCoursesForCollege(collegeName);
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
    const data = await getBatchesForCollege(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { collegeName, course, batch, session, hostelName } = req.query;
    if (!hostelName) {
      return res.status(400).json({ success: false, message: "Please Select Hostel Name" });
    }
    const data = await getHostelReport({ collegeName, course, batch, session, hostelName });
    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const pendingReport = async (req, res) => {
  try {
    const { collegeName, course, batch, session, hostelName } = req.query;
    if (!hostelName) {
      return res.status(400).json({ success: false, message: "Please Select Hostel Name" });
    }
    const data = await getHostelPendingReport({ collegeName, course, batch, session, hostelName });
    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { hostelNames, sessions, courses, batches, report, pendingReport };