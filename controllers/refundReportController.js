const {
  getLedgerNames, getSessions, getRefundReport, getRefundExportData,
} = require("../models/refundReportModel");

const ledgerNames = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getLedgerNames(collegeName);
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
    const { collegeName, ledgerName, session } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please select College Name" });
    if (!ledgerName) return res.status(400).json({ success: false, message: "Please select Ledger Name" });

    const data = await getRefundReport({ collegeName, ledgerName, session: session || undefined });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const exportData = async (req, res) => {
  try {
    const { collegeName, ledgerName, session } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please Select College" });

    const rows = await getRefundExportData({ collegeName, ledgerName: ledgerName || undefined, session: session || undefined });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record is found to Export" });
    }

    return res.status(200).json({ success: true, data: { rows } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { ledgerNames, sessions, display, exportData };