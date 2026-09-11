
const {
  getColleges,
  getLedgerNames,
  searchReceipt,
  addCancelledReceipt,
  getCancelledReceipts,
} = require("../models/cancelReceiptModel");

const getColleges_ = async (req, res) => {
  try {
    const colleges = await getColleges();
    return res.status(200).json({ success: true, colleges });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getLedgerNamesForCollege = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }
    const ledgerNames = await getLedgerNames(collegeName);
    return res.status(200).json({ success: true, ledgerNames });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors VB's validation order in btnSearch_Click exactly.
const search = async (req, res) => {
  try {
    const { collegeName, ledgerName, session, receiptNo } = req.query;

    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Please Specify College Name" });
    }
    if (!ledgerName) {
      return res.status(400).json({ success: false, message: "Please Specify Ledger Name" });
    }
    if (!receiptNo) {
      return res.status(400).json({ success: false, message: "Please Specify Receipt No" });
    }
    if (isNaN(Number(receiptNo))) {
      return res.status(400).json({ success: false, message: "Please Specify valid Receipt No" });
    }
    if (!session) {
      return res.status(400).json({ success: false, message: "Please Specify Session" });
    }

    const rows = await searchReceipt({
      collegeName,
      ledgerName,
      session,
      receiptNo: Number(receiptNo),
    });

    return res.status(200).json({ success: true, rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addToCancelled = async (req, res) => {
  try {
    const { collegeName, ledgerName, session, receiptNo, comments } = req.body;

    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please Specify Comments to Cancel Receipt",
      });
    }
    if (!collegeName || !ledgerName || !session || !receiptNo) {
      return res.status(400).json({
        success: false,
        message: "Missing required search criteria",
      });
    }

    const result = await addCancelledReceipt({
      collegeName,
      ledgerName,
      session,
      receiptNo: Number(receiptNo),
      comments: comments.trim(),
      userId: req.user?.username || req.user?.id || null,
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const listCancelled = async (req, res) => {
  try {
    const { collegeName, dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, message: "dateFrom and dateTo are required" });
    }

    const rows = await getCancelledReceipts({
      collegeName: collegeName || undefined,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });

    return res.status(200).json({ success: true, rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getColleges: getColleges_,
  getLedgerNamesForCollege,
  search,
  addToCancelled,
  listCancelled,
};