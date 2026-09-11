const schemeService = require("../services/schemeService");

const getAuthenticatedUsername = (req) => {
  return req.user?.username || req.user?.UserName || req.query.username;
};

const getSchemes = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName } = req.query;
    const result = await schemeService.getSchemes(username, collegeName);

    return res.status(200).json({
      success: true,
      message: "Scheme records retrieved successfully.",
      data: result.records,
      totalRecords: result.totalRecords,
    });
  } catch (error) {
    console.error("Error in getSchemes controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch scheme records.",
    });
  }
};

const createScheme = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, scheme } = req.body;
    await schemeService.createScheme(username, { collegeName, scheme });

    return res.status(201).json({
      success: true,
      message: "Scheme record added successfully!",
    });
  } catch (error) {
    console.error("Error in createScheme controller:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add scheme record.",
    });
  }
};

module.exports = {
  getSchemes,
  createScheme,
};
