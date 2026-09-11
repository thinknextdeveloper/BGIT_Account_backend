const model = require("../models/studentActivityFundModel");

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await model.getCourses(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const semesters = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await model.getSemesters(collegeName);
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
    const data = await model.getBatches(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const currentSession = async (req, res) => {
  try {
    const data = await model.getCurrentSession();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { collegeName, course, batch, semester, dateFrom, dateTo } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Please Specify College" });
    }

    const data = await model.getStudentActivityFundReport({
      collegeName, course, batch, semester,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No record found!" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { courses, semesters, batches, currentSession, report };