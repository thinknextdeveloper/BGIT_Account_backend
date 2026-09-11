const ledgerService = require("../services/ledgerService");

const getAuthenticatedUsername = (req) => {
  return req.user?.username || req.user?.UserName || req.query.username;
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
    const result = await ledgerService.getLedgers(username, collegeName);

    return res.status(200).json({
      success: true,
      message: "Ledger records retrieved successfully.",
      data: result.records,
      totalRecords: result.totalRecords,
    });
  } catch (error) {
    console.error("Error in getLedgers controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch ledger records.",
    });
  }
};

const createLedger = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, ledgerName } = req.body;
    await ledgerService.createLedger(username, { collegeName, ledgerName });

    return res.status(201).json({
      success: true,
      message: "Ledger record added successfully!",
    });
  } catch (error) {
    console.error("Error in createLedger controller:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add ledger record.",
    });
  }
};

module.exports = {
  getLedgers,
  createLedger,
};
