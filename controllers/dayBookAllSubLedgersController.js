const { getDayBookAllSubLedgers, getCashAndOtherTotals } = require("../models/dayBookAllSubLedgersModel");

const display = async (req, res) => {
  try {
    const { collegeName, dateFrom, dateTo } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Please Select CollegeName" });
    }
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, message: "Please select a date range" });
    }

    const rows = await getDayBookAllSubLedgers({ collegeName, dateFrom, dateTo });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found." });
    }

    const columns = Object.keys(rows[0]);
    return res.status(200).json({ success: true, data: { rows, columns, totalRecords: rows.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Supplies the cash/other/total figures the Crystal Report header shows.
// Exposed separately since the frontend prints its own layout rather than
// rendering a Crystal Report.
const totals = async (req, res) => {
  try {
    const { collegeName, dateFrom, dateTo } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please Select CollegeName" });
    if (!dateFrom || !dateTo) return res.status(400).json({ success: false, message: "Please select a date range" });

    const data = await getCashAndOtherTotals({ collegeName, dateFrom, dateTo });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { display, totals };