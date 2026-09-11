const {
  getAllColleges,
  getCoursesByCollege,
  getBatchesByCollegeAndCourse,
  getSemestersByCollegeCourseBatch,
} = require("../models/masterCourseModel");

const getColleges = async (req, res) => {
  try {
    const colleges = await getAllColleges();
    return res.status(200).json({
      success: true,
      message: "Colleges fetched successfully.",
      data: colleges.map((row) => row.CollegeName),
    });
  } catch (error) {
    console.error("Get colleges error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const getCourses = async (req, res) => {
  try {
    const { collegeName } = req.query;

    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName is required.",
      });
    }

    const courses = await getCoursesByCollege(collegeName);
    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully.",
      data: courses.map((row) => row.Course),
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const getBatches = async (req, res) => {
  try {
    const { collegeName, course } = req.query;

    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName is required.",
      });
    }

    const batches = await getBatchesByCollegeAndCourse(collegeName, course);
    return res.status(200).json({
      success: true,
      message: "Batches fetched successfully.",
      data: batches.map((row) => row.Batch),
    });
  } catch (error) {
    console.error("Get batches error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const getSemesters = async (req, res) => {
  try {
    const { collegeName, course, batch } = req.query;

    if (!collegeName || !batch) {
      return res.status(400).json({
        success: false,
        message: "collegeName and batch are required.",
      });
    }

    const semesters = await getSemestersByCollegeCourseBatch(collegeName, course, batch);
    return res.status(200).json({
      success: true,
      message: "Semesters fetched successfully.",
      data: semesters.map((row) => ({
        semester: row.Semester,
        semesterId: row.SemesterID,
      })),
    });
  } catch (error) {
    console.error("Get semesters error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  getColleges,
  getCourses,
  getBatches,
  getSemesters,
};