const ExcelJS = require("exceljs");
const model = require("../models/allRecordModel");

const colleges = async (req, res) => {
  try {
    const data = await model.getColleges();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
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
    const data = await model.getBatches(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const feeCategories = async (req, res) => {
  try {
    const data = await model.getFeeCategories();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sessions = async (req, res) => {
  try {
    const data = await model.getSessions();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

function computeTotals(rows) {
  const totalDebit = rows.reduce((sum, r) => sum + (r.Debit || 0), 0);
  const totalCredit = rows.reduce((sum, r) => sum + (r.Credit || 0), 0);
  return {
    totalDebit,
    totalCredit,
    totalPending: totalDebit - totalCredit,
    totalRecords: rows.length,
  };
}

// Mirrors btnShow_Click -> Display4() + total()
const display = async (req, res) => {
  try {
    const { collegeName, course, batch, semester, session, feeCategory } = req.query;

    const start = Date.now();
    const rows = await model.getAllRecords({ collegeName, course, batch, semester, session, feeCategory });
    console.log(`AllRecords took ${Date.now() - start}ms for ${rows.length} rows`);

    // Always 200 here — an empty result set is a valid outcome of a
    // search, not a server error. Let the client decide how to render
    // "nothing found" instead of treating it as a rejected request.
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { rows: [], columns: [], totalDebit: 0, totalCredit: 0, totalPending: 0, totalRecords: 0 },
      });
    }

    const totals = computeTotals(rows);
    const columns = Object.keys(rows[0]);

    return res.status(200).json({
      success: true,
      data: { rows, columns, ...totals },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors btnExport_Click — streams a .xlsx instead of driving Excel via Interop
const exportExcel = async (req, res) => {
  try {
    const { collegeName, course, batch, semester, session, feeCategory } = req.query;

    const rows = await model.getAllRecords({ collegeName, course, batch, semester, session, feeCategory });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No record Found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("AllRecords");

    sheet.columns = [
      { header: "CollegeName", key: "CollegeName", width: 28 },
      { header: "StudentName", key: "StudentName", width: 22 },
      { header: "Course", key: "Course", width: 16 },
      { header: "Batch", key: "Batch", width: 10 },
      { header: "Semester", key: "Semester", width: 12 },
      { header: "Session", key: "Session", width: 12 },
      { header: "FeeCategory", key: "FeeCategory", width: 16 },
      { header: "Debit", key: "Debit", width: 12 },
      { header: "Credit", key: "Credit", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach((r) => sheet.addRow(r));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="AllRecords.xlsx"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { colleges, courses, batches, feeCategories, sessions, display, exportExcel };