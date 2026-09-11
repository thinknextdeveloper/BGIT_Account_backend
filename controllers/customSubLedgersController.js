const {
  getCoursesByCollege,
  getBatchesByCollege,
  getSemestersByCollege,
  getSubHeadsByCollege,
  getSessions,
  getCustomSubLedgerReport,
} = require("../models/customSubLedgersModel");

// Some API clients stringify JS `undefined`/`null` into the literal text
// "undefined"/"null" when building a query string, instead of omitting the
// param. Treat those (and empty strings) as "not provided" so an optional
// filter can never silently zero out every row.
function cleanParam(value) {
  if (value === undefined || value === null) return undefined;
  if (value === "undefined" || value === "null" || value === "") return undefined;
  return value;
}


const courses = async (req, res) => {
  try {
    const { college } = req.query;
    if (!college) return res.status(400).json({ success: false, message: "Please Specify College" });
    return res.status(200).json({ success: true, data: await getCoursesByCollege(college) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const batches = async (req, res) => {
  try {
    const { college } = req.query;
    if (!college) return res.status(400).json({ success: false, message: "Please Specify College" });
    return res.status(200).json({ success: true, data: await getBatchesByCollege(college) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const semesters = async (req, res) => {
  try {
    const { college } = req.query;
    if (!college) return res.status(400).json({ success: false, message: "Please Specify College" });
    return res.status(200).json({ success: true, data: await getSemestersByCollege(college) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const subHeads = async (req, res) => {
  try {
    const { college } = req.query;
    if (!college) return res.status(400).json({ success: false, message: "Please Specify College" });
    return res.status(200).json({ success: true, data: await getSubHeadsByCollege(college) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sessions = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: await getSessions() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { college, course, batch, semester, session, dateFrom, dateTo, subHeads: subHeadsCsv } = req.query;

    // Same validation as btnDisplay_Click: College is required, and at
    // least one sub-ledger head must be selected.
    if (!college) return res.status(400).json({ success: false, message: "Please Specify College" });
    const subHeadList = subHeadsCsv ? subHeadsCsv.split(",").filter(Boolean) : [];
    if (subHeadList.length === 0) {
      return res.status(400).json({ success: false, message: "Please specify Sub Ledger" });
    }

    const data = await getCustomSubLedgerReport({
      collegeName: college,
      course: cleanParam(course),
      batch: cleanParam(batch),
      semester: cleanParam(semester),
      session: cleanParam(session),
      dateFrom: cleanParam(dateFrom),
      dateTo: cleanParam(dateTo),
      subHeads: subHeadList,
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

module.exports = { courses, batches, semesters, subHeads, sessions, report };