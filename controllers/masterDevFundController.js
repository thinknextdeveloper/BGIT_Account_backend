const {
  getFiltered,
  existsInMasterCourse,
  existsDuplicate,
  insertRow,
  updateRow,
} = require("../models/masterDevFundModel");

const display = async (req, res) => {
  try {
    const { collegeName, course, batch, semester } = req.query;

    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName is required.",
      });
    }

    const rows = await getFiltered(collegeName, course, batch, semester);
    return res.status(200).json({
      success: true,
      message: "Records fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Display dev fund error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const addRow = async (req, res) => {
  try {
    const row = req.body;

    if (!row.session || !row.collegeName || !row.course || !row.batch || !row.semester || !row.scheme || !row.category) {
      return res.status(400).json({
        success: false,
        message: "Session, College, Course, Batch, Semester, Scheme and Category are required.",
      });
    }

    const courseMatch = await existsInMasterCourse(row.collegeName, row.course, row.batch, row.semester);
    if (!courseMatch) {
      return res.status(400).json({
        success: false,
        message: `Record does not exist in MasterCourse for ${row.collegeName}, ${row.course}, ${row.batch}, ${row.semester}.`,
      });
    }

    const duplicate = await existsDuplicate(
      row.session,
      row.collegeName,
      row.course,
      row.batch,
      row.semester,
      row.scheme,
      row.category
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Sorry, this entry already exists.",
      });
    }

    const newRow = await insertRow({ ...row, semesterId: courseMatch.SemesterID });

    return res.status(201).json({
      success: true,
      message: "Record added successfully.",
      data: newRow,
    });
  } catch (error) {
    console.error("Add dev fund error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const editRow = async (req, res) => {
  try {
    const { originalKey, newValues } = req.body;

    if (!originalKey || !newValues) {
      return res.status(400).json({
        success: false,
        message: "originalKey and newValues are required.",
      });
    }

    const courseMatch = await existsInMasterCourse(
      newValues.collegeName,
      newValues.course,
      newValues.batch,
      newValues.semester
    );
    if (!courseMatch) {
      return res.status(400).json({
        success: false,
        message: `Record does not exist in MasterCourse for ${newValues.collegeName}, ${newValues.course}, ${newValues.batch}, ${newValues.semester}.`,
      });
    }

    const keyChanged =
      originalKey.session !== newValues.session ||
      originalKey.collegeName !== newValues.collegeName ||
      originalKey.course !== newValues.course ||
      originalKey.batch !== newValues.batch ||
      originalKey.semester !== newValues.semester ||
      originalKey.scheme !== newValues.scheme ||
      originalKey.category !== newValues.category;

    if (keyChanged) {
      const duplicate = await existsDuplicate(
        newValues.session,
        newValues.collegeName,
        newValues.course,
        newValues.batch,
        newValues.semester,
        newValues.scheme,
        newValues.category
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Sorry, this entry already exists.",
        });
      }
    }

    const updated = await updateRow(originalKey, { ...newValues, semesterId: courseMatch.SemesterID });

    return res.status(200).json({
      success: true,
      message: "Record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Edit dev fund error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  display,
  addRow,
  editRow,
};