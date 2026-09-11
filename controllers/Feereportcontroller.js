const {
  getSessions,
  getFeeReportSingleLedger,
  getFeeReportAllLedgers,
  getLedgerNamesForCollege,
} = require("../models/feeReportModel");

const clean = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (s === "" || s === "undefined" || s === "null") return undefined;
  return s;
};

const sessions = async (req, res) => {
  try {
    const rows = await getSessions();
    return res.status(200).json({
      success: true,
      data: rows.map((r) => r.Session),
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const ledgerNames = async (req, res) => {
  try {
    const collegeName = clean(req.query.collegeName);
    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName is required.",
      });
    }

    const names = await getLedgerNamesForCollege(collegeName);
    return res.status(200).json({
      success: true,
      data: names,
    });
  } catch (error) {
    console.error("Get ledger names error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// controllers — updated report() to include totalsRow
const report = async (req, res) => {
  try {
    const collegeName = clean(req.query.collegeName);
    const course = clean(req.query.course);
    const batch = clean(req.query.batch);
    const semester = clean(req.query.semester);
    const session = clean(req.query.session);
    const ledgerName = clean(req.query.ledgerName);
    const dateFrom = clean(req.query.dateFrom);
    const dateTo = clean(req.query.dateTo);
    const allSubLedgers = req.query.allSubLedgers === "true";

    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required." });
    }

    const filters = { collegeName, course, batch, semester, session, ledgerName, dateFrom, dateTo };

    if (allSubLedgers) {
      const { rows, ledgerColumns, totalsRow } = await getFeeReportAllLedgers(filters);
      return res.status(200).json({
        success: true,
        mode: "all",
        ledgerColumns,
        totalRecords: rows.length,
        data: rows,
        totalsRow,
      });
    }

    if (!ledgerName) {
      return res.status(400).json({
        success: false,
        message: "ledgerName is required unless 'All Sub Ledgers' is checked.",
      });
    }

    const rows = await getFeeReportSingleLedger(filters);
    const totalsRow = {
      label: "Total",
      [ledgerName]: rows.reduce((sum, r) => sum + (Number(r.Amount) || 0), 0),
      Total: rows.reduce((sum, r) => sum + (Number(r.Amount) || 0), 0),
    };

    return res.status(200).json({
      success: true,
      mode: "single",
      ledgerColumns: [ledgerName],
      totalRecords: rows.length,
      data: rows,
      totalsRow,
    });
  } catch (error) {
    console.error("Get fee report error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

module.exports = { sessions, ledgerNames, report };