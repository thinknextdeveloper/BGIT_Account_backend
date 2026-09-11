const model = require("../models/ledgerStatusModel");

const ACTION_MAP = {
  current: model.getLedgerStatusCurrent,
  "zero-balance": model.getLedgerStatusZeroBalance,
  "with-left": model.getLedgerStatusWithLeft,
  "left-only": model.getLedgerStatusLeftOnly,
  active: model.getLedgerStatusActive,
  inactive: model.getLedgerStatusInactive,
};

const report = async (req, res) => {
  try {
    const { collegeName, course, batch, ledgerName, semester, session,
            idType, action = "current", feeCategories } = req.body;

    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Please Select College" });
    }

    const parsedFeeCategories = Array.isArray(feeCategories) ? feeCategories : [];

    let data;
    if (idType === "registration") {
      data = await model.getLedgerStatusByRegistration({
        collegeName, course, batch, ledgerName, semester, session,
      });
    } else {
      const fn = ACTION_MAP[action];
      if (!fn) return res.status(400).json({ success: false, message: "Unknown action" });
      data = await fn({ collegeName, course, batch, feeCategories: parsedFeeCategories });
    }

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record Found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.code === "NOT_IMPLEMENTED") {
      return res.status(501).json({ success: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const semesters = async (req, res) => {
  try {
    const data = await model.getSemesters();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const feeCategories = async (req, res) => {
  try {
    const data = await model.getFeeCategories();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { report, semesters, feeCategories };