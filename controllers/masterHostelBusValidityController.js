const {
  getAll,
  getFiltered,
  existsInMasterCourse,
  existsDuplicate,
  insertRow,
  updateRow,
} = require("../models/masterHostelBusValidityModel");

const displayAll = async (req, res) => {
  try {
    const rows = await getAll();
    return res.status(200).json({
      success: true,
      message: "Records fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Display all error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const display = async (req, res) => {
  try {
    const { collegeName, batch, semester } = req.query;

    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: "collegeName is required.",
      });
    }

    const rows = await getFiltered(collegeName, batch, semester);
    return res.status(200).json({
      success: true,
      message: "Records fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Display error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const addRow = async (req, res) => {
  try {
    const { collegeName, batch, semester, facility, validUpTo } = req.body;

    if (!collegeName || !batch || !semester || !facility) {
      return res.status(400).json({
        success: false,
        message: "collegeName, batch, semester and facility are required.",
      });
    }

    const validCourse = await existsInMasterCourse(collegeName, batch, semester);
    if (!validCourse) {
      return res.status(400).json({
        success: false,
        message: `Record does not exist in MasterCourse! You have to enter a record for ${collegeName}, ${batch}, ${semester} in MasterCourse first.`,
      });
    }

    const duplicate = await existsDuplicate(collegeName, batch, semester, facility);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This entry already exists.",
      });
    }

    const newRow = await insertRow({ collegeName, batch, semester, facility, validUpTo });

    return res.status(201).json({
      success: true,
      message: "Record added successfully.",
      data: newRow,
    });
  } catch (error) {
    console.error("Add row error:", error);
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

    const validCourse = await existsInMasterCourse(
      newValues.collegeName,
      newValues.batch,
      newValues.semester
    );
    if (!validCourse) {
      return res.status(400).json({
        success: false,
        message: `Record does not exist in MasterCourse! Please enter a record for ${newValues.collegeName}, ${newValues.batch}, ${newValues.semester} in MasterCourse first.`,
      });
    }

    const keyChanged =
      originalKey.collegeName !== newValues.collegeName ||
      originalKey.batch !== newValues.batch ||
      originalKey.semester !== newValues.semester ||
      originalKey.facility !== newValues.facility;

    if (keyChanged) {
      const duplicate = await existsDuplicate(
        newValues.collegeName,
        newValues.batch,
        newValues.semester,
        newValues.facility
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Sorry, this entry already exists.",
        });
      }
    }

    const updated = await updateRow(originalKey, newValues);

    return res.status(200).json({
      success: true,
      message: "Record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Edit row error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  displayAll,
  display,
  addRow,
  editRow,
};