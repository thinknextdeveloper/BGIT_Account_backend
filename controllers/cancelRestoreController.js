const cancelRestoreService = require("../services/cancelRestoreService");

const displayStudentDetail = async (req, res) => {
  try {
    const idNo = req.query.idNo || req.query.id;
    const username = req.user?.username || req.user?.userName || req.query.username || "";
    console.log("------------------------------------------");
    console.log("📌 Logged-in Username (Controller):", username);
    console.log("------------------------------------------");

    if (!idNo || String(idNo).toUpperCase() === "ALL" || String(idNo).toUpperCase() === "CANCELLED") {
      console.log("[CancelRestore Controller] Fetching DisplayAllCancellation records for user:", username);
      const cancResult = await cancelRestoreService.displayAllCancellation(username);
      const recordsArray = Array.isArray(cancResult) ? cancResult : (cancResult?.records || []);
      return res.status(200).json({
        success: true,
        message: "Cancelled admissions retrieved successfully.",
        data: {
          records: recordsArray,
        },
      });
    }

    const result = await cancelRestoreService.displayStudentDetail(idNo, username);

    return res.status(200).json({
      success: true,
      message: "Student detail retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in displayStudentDetail controller:", error.message);
    return res.status(200).json({
      success: false,
      message: error.message || "No Record Found",
    });
  }
};

const displayAllCancellation = async (req, res) => {
  try {
    const username = req.user?.username || req.user?.userName || req.query.username || "";
    const result = await cancelRestoreService.displayAllCancellation(username);
    const recordsArray = Array.isArray(result) ? result : (result?.records || []);

    return res.status(200).json({
      success: true,
      message: "Cancelled admissions retrieved successfully.",
      data: {
        records: recordsArray,
      },
    });
  } catch (error) {
    console.error("Error in displayAllCancellation controller:", error.message);
    return res.status(200).json({
      success: false,
      message: error.message || "Failed to fetch cancelled admissions",
    });
  }
};

const getCoursesByCollege = async (req, res) => {
  try {
    const collegeName = req.query.collegeName || req.query.college || "";
    const courses = await cancelRestoreService.getCoursesByCollege(collegeName);
    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error in getCoursesByCollege controller:", error.message);
    return res.status(200).json({
      success: false,
      message: error.message || "Failed to fetch courses",
      data: [],
    });
  }
};

const addCancelledAdmission = async (req, res) => {
  try {
    const username = req.user?.username || req.user?.userName || req.body.username || "";

    if (req.body?.action === "restore" || req.body?.mode === "restore" || req.body?.isRestore) {
      const idNo = req.body?.idNo || req.query?.idNo;
      const result = await cancelRestoreService.restoreAdmission(idNo, username);
      return res.status(200).json({
        success: true,
        message: result.message || "Record has been successfully added in to Admissionss",
        data: result,
      });
    }

    const result = await cancelRestoreService.addCancelledAdmission(req.body, username);
    return res.status(200).json({
      success: true,
      message: "Admission cancelled successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in addCancelledAdmission controller:", error.message);
    return res.status(200).json({
      success: false,
      message: error.message || "Failed to process request",
    });
  }
};

const restoreAdmission = async (req, res) => {
  try {
    const username = req.user?.username || req.user?.userName || req.body.username || "";
    const idNo = req.body?.idNo || req.query?.idNo;
    const result = await cancelRestoreService.restoreAdmission(idNo, username);
    return res.status(200).json({
      success: true,
      message: result.message || "Record has been successfully added in to Admissionss",
      data: result,
    });
  } catch (error) {
    console.error("Error in restoreAdmission controller:", error.message);
    return res.status(200).json({
      success: false,
      message: error.message || "Failed to restore admission",
    });
  }
};

module.exports = {
  displayStudentDetail,
  displayAllCancellation,
  getCoursesByCollege,
  addCancelledAdmission,
  restoreAdmission,
};

