const {
  getColleges,
  getCourses,
  getBatches,
  getSemesters,
  getHeads,
  getLedgerFeeStatus,
  cleanParam,
} = require("../models/allDebitRecordModel");

const colleges = async (req, res) => {
  try {
    const data = await getColleges();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const courses = async (req, res) => {
  try {
    const collegeName = cleanParam(req.query.collegeName);
    if (!collegeName)
      return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getCourses(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const batches = async (req, res) => {
  try {
    const collegeName = cleanParam(req.query.collegeName);
    if (!collegeName)
      return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getBatches(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const semesters = async (req, res) => {
  try {
    const collegeName = cleanParam(req.query.collegeName);
    const course = cleanParam(req.query.course);
    const batch = cleanParam(req.query.batch);
    if (!collegeName)
      return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getSemesters({ collegeName, course, batch });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const heads = async (req, res) => {
  try {
    const collegeName = cleanParam(req.query.collegeName);
    if (!collegeName)
      return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getHeads(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors btnShow_Click -> Display4(), including its validation order:
// college -> batch -> course -> semester.
const display = async (req, res) => {
  try {
    const collegeName = cleanParam(req.query.collegeName);
    const course = cleanParam(req.query.course);
    const batch = cleanParam(req.query.batch);
    const semester = cleanParam(req.query.semester);

    if (!collegeName)
      return res.status(400).json({ success: false, message: "Please Select College First" });
    if (!batch)
      return res.status(400).json({ success: false, message: "Please Select Batch First" });
    if (!course)
      return res.status(400).json({ success: false, message: "Please Select Course First" });
    if (!semester)
      return res.status(400).json({ success: false, message: "Please Select Semester First" });

    const data = await getLedgerFeeStatus({ collegeName, course, batch, semester });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No record Found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { colleges, courses, batches, semesters, heads, display };