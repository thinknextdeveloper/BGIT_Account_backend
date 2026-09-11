const { getAllSchemes, createScheme } = require("../models/masterSchemeModel");

const listSchemes = async (req, res) => {
  try {
    const schemes = await getAllSchemes();
    return res.status(200).json({
      success: true,
      message: "Schemes fetched successfully.",
      data: schemes,
    });
  } catch (error) {
    console.error("List schemes error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const addScheme = async (req, res) => {
  try {
    const { collegeName, scheme } = req.body;

    if (!collegeName || !scheme) {
      return res.status(400).json({
        success: false,
        message: "collegeName and scheme are required.",
      });
    }

    const newRow = await createScheme(collegeName, scheme);

    return res.status(201).json({
      success: true,
      message: "Scheme added successfully.",
      data: newRow,
    });
  } catch (error) {
    console.error("Add scheme error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  listSchemes,
  addScheme,
};