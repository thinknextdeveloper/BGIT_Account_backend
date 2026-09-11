

const { getStudents, updateField } = require("../models/admissionsModel");

const display = async (req, res) => {
  try {
    const { collegeName, course, batch } = req.query;

    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName is required.",
      });
    }

    const rows = await getStudents(collegeName, course, batch);

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Display students error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const updateStudentField = async (req, res) => {
  try {
    const { idNo, field, value } = req.body;

    if (!idNo || !field) {
      return res.status(400).json({
        success: false,
        message: "idNo and field are required.",
      });
    }

    const updated = await updateField(idNo, field, value);

    return res.status(200).json({
      success: true,
      message: "Updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update student field error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  display,
  updateStudentField,
};