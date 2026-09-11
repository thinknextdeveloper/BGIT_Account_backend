const studentBasicDetailsService = require("../services/studentBasicDetailsService");

const getAuthenticatedUsername = (req) => {
  return req.user?.username || req.user?.UserName || req.query.username;
};

const getStudentBasicDetails = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, page, limit, search } = req.query;
    const result = await studentBasicDetailsService.getStudentBasicDetails(
      username,
      collegeName,
      page,
      limit,
      search
    );

    return res.status(200).json({
      success: true,
      message: "Student basic details retrieved successfully.",
      data: result.records,
      totalRecords: result.totalRecords,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Error in getStudentBasicDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student basic details.",
    });
  }
};

const getColleges = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const colleges = await studentBasicDetailsService.getCollege(username);
    return res.status(200).json({
      success: true,
      message: "Colleges fetched successfully.",
      data: colleges.map((c) => c.CollegeName),
    });
  } catch (error) {
    console.error("Error in getColleges controller for StudentBasicDetails:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch colleges.",
    });
  }
};

module.exports = {
  getStudentBasicDetails,
  getColleges,
};
