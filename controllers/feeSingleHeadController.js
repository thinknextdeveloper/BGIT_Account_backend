const feeSingleHeadService = require("../services/feeSingleHeadService");
const { sql, getPool } = require("../config/db");
const getAuthenticatedUsername = (req) => {
  return req.user?.username || req.user?.UserName || req.query.username;
};

const getStudentFeeDetails = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { idNo, action, type } = req.query;
    if (action === "cancellation" || type === "cancellation") {
      console.log("[FeeSingleHead Controller] Fetching cancelled admissions for user:", username);
      const cancResult = await feeSingleHeadService.displayAllCancellation(username);
      return res.status(200).json({
        success: true,
        message: "Cancelled admissions retrieved successfully.",
        data: cancResult,
      });
    }

    console.log("[FeeSingleHead Controller] Request received for idNo:", idNo, "from user:", username);
    const result = await feeSingleHeadService.getStudentFeeDetails(username, idNo);
    console.log("[FeeSingleHead Controller] Service returned ledger count:", result.ledgerDetails?.length);

    return res.status(200).json({
      success: true,
      message: "Student fee details retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in getStudentFeeDetails controller:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch student fee details.",
    });
  }
};

const getBanks = async (req, res) => {
  try {
    const banks = await feeSingleHeadService.getBanks();
    return res.status(200).json({
      success: true,
      message: "Banks fetched successfully.",
      data: banks,
    });
  } catch (error) {
    console.error("Error in getBanks controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch banks.",
    });
  }
};

const createBank = async (req, res) => {
  try {
    const { bankName } = req.body;
    if (!bankName || String(bankName).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please enter Bank Name.",
      });
    }

    const addedBank = await feeSingleHeadService.createBank(bankName);
    const updatedBanks = await feeSingleHeadService.getBanks();

    return res.status(200).json({
      success: true,
      message: "Bank Name added successfully.",
      data: addedBank,
      banks: updatedBanks,
    });
  } catch (error) {
    console.error("Error in createBank controller:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add Bank Name.",
    });
  }
};


const getLedgers = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName } = req.query;
    const ledgers = await feeSingleHeadService.getLedgers(username, collegeName);

    return res.status(200).json({
      success: true,
      message: "Ledgers fetched successfully.",
      data: ledgers,
    });
  } catch (error) {
    console.error("Error in getLedgers controller:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch ledgers.",
    });
  }
};

const getReceiptNo = async (req, res) => {
  try {
    const { session } = req.query;
    const receiptNo = await feeSingleHeadService.calcReceiptNo(session);

    return res.status(200).json({
      success: true,
      message: "ReceiptNo calculated successfully.",
      data: receiptNo,
    });
  } catch (error) {
    console.error("Error in getReceiptNo controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate ReceiptNo.",
    });
  }
};

const getSemesters = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    const { collegeName } = req.query;
    const semesters = await feeSingleHeadService.getSemesters(username, collegeName);

    return res.status(200).json({
      success: true,
      message: "Semesters fetched successfully.",
      data: semesters,
    });
  } catch (error) {
    console.error("Error in getSemesters controller:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch semesters.",
    });
  }
};

const saveFeeEntry = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const payload = req.body;
    console.log("[FeeSingleHead Controller] saveFeeEntry called for student IDNo:", payload?.idNo);

    const result = await feeSingleHeadService.saveFeeEntry(username, payload);

    return res.status(200).json({
      success: true,
      message: "Fee entry saved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in saveFeeEntry controller:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to save fee entry.",
    });
  }
};

const searchReceipt = async (req, res) => {
  try {
    const { collegeName, ledgerName, receiptNo, session, searchType } = req.query;
    const result = await feeSingleHeadService.searchReceipt(collegeName, ledgerName, receiptNo, session, searchType);
    const hasRecords = result?.records && result.records.length > 0;
    return res.status(200).json({
      success: true,
      message: hasRecords ? "Receipt details retrieved successfully." : "Sorry! No Record Found",
      data: result,
    });
  } catch (error) {
    console.error("Error in searchReceipt controller:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Sorry! No Record Found",
    });
  }
};

const displayAllCancellation = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    const result = await feeSingleHeadService.displayAllCancellation(username);

    return res.status(200).json({
      success: true,
      message: "Cancelled admissions retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in displayAllCancellation controller:", error.message);
    return res.status(200).json({
      success: false,
      message: error.message || "Failed to fetch cancelled admissions",
    });
  }
};

module.exports = {
  getStudentFeeDetails,
  getBanks,
  createBank,
  getLedgers,
  getReceiptNo,
  getSemesters,
  saveFeeEntry,
  searchReceipt,
  displayAllCancellation,
};
