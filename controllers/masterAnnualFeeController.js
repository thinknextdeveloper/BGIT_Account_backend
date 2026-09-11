const { getFeeStructure, insertFeeRow, getMasterAnnualFeeReport } = require("../models/masterAnnualFeeModel");

const displayFeeStructure = async (req, res) => {
  try {
    const { collegeName, course, batch, semester } = req.query;

    if (!collegeName || !course || !batch || !semester) {
      return res.status(400).json({
        success: false,
        message: "collegeName, course, batch and semester are required.",
      });
    }

    const rows = await getFeeStructure(collegeName, course, batch, semester);

    return res.status(200).json({
      success: true,
      message: "Fee structure fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Display fee structure error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// const saveFeeStructure = async (req, res) => {
//   try {
//     const { rows } = req.body;
//     console.log("Rows received:", rows);
//     if (!Array.isArray(rows) || rows.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "rows must be a non-empty array.",
//       });
//     }

//     for (const row of rows) {
//       await insertFeeRow(row);
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Fee structure saved successfully.",
//     });
//   } catch (error) {
//     console.error("Save fee structure error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong. Please try again.",
//     });
//   }
// };
const saveFeeStructure = async (req, res) => {
  try {
    const { rows } = req.body;

    console.log("Rows received:", rows);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rows must be a non-empty array.",
      });
    }

    for (const row of rows) {
      console.log("Current row:", row);
      await insertFeeRow(row);
    }

    return res.status(200).json({
      success: true,
      message: "Fee structure saved successfully.",
    });
  } catch (error) {
    console.error("Save fee structure error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// ---- Added for the "all records" grid view (frmMasterAnnualFeeReport) ----
const report = async (req, res) => {
  try {
    const rows = await getMasterAnnualFeeReport();
    return res.status(200).json({
      success: true,
      data: { rows, totalRecords: rows.length },
    });
  } catch (error) {
    console.error("Master annual fee report error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  displayFeeStructure,
  saveFeeStructure,
  report,
};