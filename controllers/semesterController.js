const semesterService = require("../services/semesterService");

/**
 * Semester Controller Layer
 * Handles incoming Express requests, delegating to Service layer and returning JSON.
 */

// Helper to extract username from authenticated JWT token or query parameter fallback
const getAuthenticatedUsername = (req) => {
  return req.user?.username || req.user?.UserName || req.query.username;
};

const displayAll = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, course, batch, semester } = req.query;
    const result = await semesterService.displayAll(username, {
      collegeName,
      course,
      batch,
      semester,
    });

    return res.status(200).json({
      success: true,
      message: "Semester records retrieved successfully.",
      data: result.records,
      totalRecords: result.totalRecords,
    });
  } catch (error) {
    console.error("Error in displayAll controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch semester records.",
    });
  }
};

const getCollege = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const colleges = await semesterService.getCollege(username);

    return res.status(200).json({
      success: true,
      message: "Colleges fetched successfully.",
      data: colleges,
    });
  } catch (error) {
    console.error("Error in getCollege controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch colleges.",
    });
  }
};

const getAssignedCollegeName = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const assignedColleges = await semesterService.getAssignedCollegeName(username);

    return res.status(200).json({
      success: true,
      message: "Assigned college names fetched successfully.",
      data: assignedColleges,
    });
  } catch (error) {
    console.error("Error in getAssignedCollegeName controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch assigned college names.",
    });
  }
};

const entryAlreadyExist = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const collegeName = req.query.collegeName || req.body.collegeName;
    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName parameter is required.",
      });
    }

    const result = await semesterService.entryAlreadyExist(username, collegeName);

    return res.status(200).json({
      success: true,
      message: "College existence checked successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in entryAlreadyExist controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check college existence.",
    });
  }
};

const getCourse = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName } = req.query;
    const courses = await semesterService.getCourse(username, collegeName);

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully.",
      data: courses,
    });
  } catch (error) {
    console.error("Error in getCourse controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch courses.",
    });
  }
};

const getBatch = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, course } = req.query;
    const batches = await semesterService.getBatch(username, collegeName, course);

    return res.status(200).json({
      success: true,
      message: "Batches fetched successfully.",
      data: batches,
    });
  } catch (error) {
    console.error("Error in getBatch controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch batches.",
    });
  }
};

const getSemester = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, course, batch } = req.query;
    const semesters = await semesterService.getSemester(username, collegeName, course, batch);

    return res.status(200).json({
      success: true,
      message: "Semesters fetched successfully.",
      data: semesters,
    });
  } catch (error) {
    console.error("Error in getSemester controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch semesters.",
    });
  }
};

const createSemester = async (req, res) => {
  try {
    const username = getAuthenticatedUsername(req);
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { collegeName, course, batch, semester } = req.body;
    await semesterService.createSemester(username, {
      collegeName,
      course,
      batch,
      semester,
    });

    return res.status(201).json({
      success: true,
      message: "Semester record added successfully!",
    });
  } catch (error) {
    console.error("Error in createSemester controller:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add semester record.",
    });
  }
};

module.exports = {
  displayAll,
  getCollege,
  getAssignedCollegeName,
  entryAlreadyExist,
  getCourse,
  getBatch,
  getSemester,
  createSemester,
};
