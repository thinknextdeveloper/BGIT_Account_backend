const {
  getLedgerNames,
  bulkUpdateReceipts,
  getMultipleHeadReport,
  getSingleHeadReport,
} = require("../models/receiptUpdateModel");

const ledgerNames = async (req, res) => {
  try {
    const names = await getLedgerNames();
    return res.status(200).json({ success: true, data: names });
  } catch (error) {
    console.error("Ledger names error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkUpdate = async (req, res) => {
  try {
    const { collegeName, session, ledgerName, displayDate, receiptFrom, receiptTo } = req.body;

    if (!collegeName || !session || !ledgerName || !displayDate || !receiptFrom || !receiptTo) {
      return res.status(400).json({
        success: false,
        message: "All fields (College, Session, Ledger, Date, Receipt From/To) are required.",
      });
    }

    const result = await bulkUpdateReceipts({
      collegeName,
      session,
      ledgerName,
      displayDate,
      receiptFrom,
      receiptTo,
    });

    return res.status(200).json({
      success: true,
      message: `Updated ${result.rowsAffected} record(s).`,
      data: result,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const multipleHeadReport = async (req, res) => {
  try {
    const { collegeName, session, receiptFrom, receiptTo, displayDate } = req.query;

    if (!collegeName || !session || !receiptFrom || !receiptTo || !displayDate) {
      return res.status(400).json({
        success: false,
        message: "collegeName, session, receiptFrom, receiptTo and displayDate are required.",
      });
    }

    const rows = await getMultipleHeadReport({
      collegeName,
      session,
      receiptFrom,
      receiptTo,
      displayDate,
    });

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Multiple head report error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const singleHeadReport = async (req, res) => {
  try {
    const { collegeName, session, ledgerName, receiptFrom, receiptTo, displayDate } = req.query;

    if (!collegeName || !session || !ledgerName || !receiptFrom || !receiptTo || !displayDate) {
      return res.status(400).json({
        success: false,
        message: "collegeName, session, ledgerName, receiptFrom, receiptTo and displayDate are required.",
      });
    }

    const rows = await getSingleHeadReport({
      collegeName,
      session,
      ledgerName,
      receiptFrom,
      receiptTo,
      displayDate,
    });

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Single head report error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { ledgerNames, bulkUpdate, multipleHeadReport, singleHeadReport };