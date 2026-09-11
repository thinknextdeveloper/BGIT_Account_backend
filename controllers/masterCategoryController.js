const { getAllCategories, createCategory } = require("../models/masterCategoryModel");

const listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully.",
      data: categories,
    });
  } catch (error) {
    console.error("List categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const addCategory = async (req, res) => {
  try {
    const { collegeName, category } = req.body;

    if (!collegeName || !category) {
      return res.status(400).json({
        success: false,
        message: "collegeName and category are required.",
      });
    }

    const newRow = await createCategory(collegeName, category);

    return res.status(201).json({
      success: true,
      message: "Category added successfully.",
      data: newRow,
    });
  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  listCategories,
  addCategory,
};