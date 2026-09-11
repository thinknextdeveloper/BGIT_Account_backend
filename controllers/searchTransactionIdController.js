const { searchTransactionById } = require("../models/searchTransactionIdModel");

const findTransaction = async (req, res) => {
  try {
    const { transactionId, college, allColleges } = req.query;
    const isAllColleges = allColleges === "true" || allColleges === true;

    if (!isAllColleges && !college) {
      return res.status(400).json({ success: false, message: "Please specify College" });
    }
    if (!transactionId || String(transactionId).trim() === "") {
      return res.status(400).json({ success: false, message: "Please Enter Transaction ID." });
    }

    const userColleges = req.user?.colleges ?? [];

    const rows = await searchTransactionById({
      transactionId,
      collegeName: college,
      allColleges: isAllColleges,
      userColleges,
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No record found", data: [] });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("searchTransactionId error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { findTransaction };
