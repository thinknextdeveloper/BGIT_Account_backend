const {
  getCourses,
  getBatches,
  getSessions,
  getLedgerWiseStatus,
} = require("../models/ledgerwiseStatusModel");

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

const sessions = async (req, res) => {
  try {
    const data = await getSessions();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const display = async (req, res) => {
  try {
    const { collegeName, course, batch, session, dateFrom, dateTo, mode } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please Select College" });

    const data = await getLedgerWiseStatus({ collegeName, course, batch, session, dateFrom, dateTo, mode });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const displayPendingFeeOnly = async (req, res) => {
  try {
    const { collegeName, course, batch, session, dateFrom, dateTo, mode } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please Select College" });

    const data = await getLedgerWiseStatus({ collegeName, course, batch, session, dateFrom, dateTo, mode });
    const pending = data.rows.filter((r) => Number(r.Balance) > 0);

    if (pending.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No record Found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        rows: pending,
        totalDebits: data.totalDebits,
        totalCredits: data.totalCredits,
        balance: data.balance,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { courses, batches, sessions, display, displayPendingFeeOnly };