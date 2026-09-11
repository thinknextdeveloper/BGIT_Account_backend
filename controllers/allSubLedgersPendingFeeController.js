const model = require("../models/allSubLedgersPendingFeeModel");

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await model.getCourses(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const batches = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await model.getBatches(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const subHeads = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await model.getSubHeads(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors btnDisplay_Click
// const display = async (req, res) => {
//   try {
//     const { collegeName, course, batch } = req.query;
//     if (!collegeName) return res.status(400).json({ success: false, message: "Please Select CollegeName" });
//     if (!course) return res.status(400).json({ success: false, message: "Please Select Course" });
//     if (!batch) return res.status(400).json({ success: false, message: "Please Select Batch" });

//     const rows = await model.getAllSubLedgerPendingFee({ collegeName, course, batch });

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: "No Record Found." });
//     }

//     // Columns come from whatever the stored proc returns — pass the key order
//     // of the first row through so the frontend can render a dynamic table.
//     const columns = Object.keys(rows[0]);
//     return res.status(200).json({ success: true, data: { rows, columns, totalRecords: rows.length } });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
const display = async (req, res) => {
  try {
    const { collegeName, course, batch } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please Select CollegeName" });
    if (!course) return res.status(400).json({ success: false, message: "Please Select Course" });
    if (!batch) return res.status(400).json({ success: false, message: "Please Select Batch" });

    const start = Date.now();
    const rows = await model.getAllSubLedgerPendingFee({ collegeName, course, batch });
    console.log(`AllSubLedgerPendingFee took ${Date.now() - start}ms for ${rows.length} rows`);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found." });
    }

    const columns = Object.keys(rows[0]);
    return res.status(200).json({ success: true, data: { rows, columns, totalRecords: rows.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Mirrors dis() / btnSingleSubHeadWise
const singleSubHead = async (req, res) => {
  try {
    const { collegeName, course, batch, subHead, session } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "Please Select CollegeName" });
    if (!subHead) return res.status(400).json({ success: false, message: "Please Select SubHead" });

    const rows = await model.getSubLedgersPendingSingleSubHead({ collegeName, course, batch, subHead, session });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found." });
    }

    const columns = Object.keys(rows[0]);
    return res.status(200).json({ success: true, data: { rows, columns, totalRecords: rows.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { courses, batches, subHeads, display, singleSubHead };