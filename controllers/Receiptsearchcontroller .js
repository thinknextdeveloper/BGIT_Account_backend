const {
  getLedgersByCollege,
  getSessions,
  getDuplicateReceipt,
} = require("../models/receiptSearchModel");

const ledgersByCollege = async (req, res) => {
  try {
    const { college } = req.query;
    if (!college) {
      return res.status(400).json({ success: false, message: "Please Select CollegeName" });
    }
    const data = await getLedgersByCollege(college);
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

const duplicateReceipt = async (req, res) => {
  try {
    const { college, ledger, session, receiptNo, searchType } = req.query;

    // Same validation order as btnPrint_Click: CollegeName -> LedgerName -> ReceiptNo
    if (!college) return res.status(400).json({ success: false, message: "Please Select CollegeName" });
    if (!ledger) return res.status(400).json({ success: false, message: "Please Select LedgerName" });
    if (!receiptNo) return res.status(400).json({ success: false, message: "Please Enter ReceiptNo" });
    if (!session) return res.status(400).json({ success: false, message: "Please Select Session" });

    const data = await getDuplicateReceipt({
      collegeName: college,
      ledgerName: ledger,
      session,
      receiptNo,
      searchType: searchType === "registrationNo" ? "registrationNo" : "idNo",
    });

    if (!data) {
      return res.status(404).json({ success: false, message: "Sorry! No Record Found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { ledgersByCollege, sessions, duplicateReceipt };