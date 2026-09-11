const { searchReceiptByNo } = require("../models/searchReceiptNoModel");

const findReceipt = async (req, res) => {
  try {
    const { receiptNo, college, allColleges } = req.query;
    const isAllColleges = allColleges === "true" || allColleges === true;

    if (!isAllColleges && !college) {
      return res.status(400).json({ success: false, message: "Please specify College" });
    }
    if (!receiptNo || String(receiptNo).trim() === "") {
      return res.status(400).json({ success: false, message: "Please Enter Receipt No." });
    }

    const userColleges = req.user?.colleges ?? [];

    const rows = await searchReceiptByNo({
      receiptNo,
      collegeName: college,
      allColleges: isAllColleges,
      userColleges,
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No record found", data: [] });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("searchReceiptNo error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { findReceipt };
