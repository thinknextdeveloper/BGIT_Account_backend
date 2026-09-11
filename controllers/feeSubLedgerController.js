const ExcelJS = require("exceljs");
const {
  getCourses, getBatches, getSemesters, getSessions, getSubLedgerHeads, getFeeSubLedgerReport,
} = require("../models/feeSubLedgerModel");

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getCourses(collegeName);
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
    const data = await getBatches(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const semesters = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getSemesters(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sessions = async (req, res) => {
  try {
    const data = await getSessions();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const subLedgerHeads = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) return res.status(400).json({ success: false, message: "collegeName is required." });
    const data = await getSubLedgerHeads(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const display = async (req, res) => {
  try {
    const {
      collegeName, course, batch, semester, session, receiptNo,
      dateFrom, dateTo, allSubLedgers, subLedgerHead,
    } = req.query;

    if (!collegeName) return res.status(400).json({ success: false, message: "Please Specify College" });
    const wantsAll = allSubLedgers === "true" || allSubLedgers === true;
    if (!wantsAll && !subLedgerHead) return res.status(400).json({ success: false, message: "Please specify SubLedger" });
    if (wantsAll && subLedgerHead) return res.status(400).json({ success: false, message: "Invalid Sub Ledger" });
    if (!session) return res.status(400).json({ success: false, message: "please specify session" });

    const data = await getFeeSubLedgerReport({
      collegeName, course, batch, semester, session, receiptNo,
      dateFrom, dateTo, allSubLedgers: wantsAll, subLedgerHead,
    });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No record found!" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const exportData = async (req, res) => {
  try {
    const {
      collegeName, course, batch, semester, session, receiptNo,
      dateFrom, dateTo, allSubLedgers, subLedgerHead,
    } = req.query;

    if (!collegeName) return res.status(400).json({ success: false, message: "Please Specify College" });
    const wantsAll = allSubLedgers === "true" || allSubLedgers === true;

    const data = await getFeeSubLedgerReport({
      collegeName, course, batch, semester, session, receiptNo,
      dateFrom, dateTo, allSubLedgers: wantsAll, subLedgerHead,
    });

    if (data.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No Record is found to Export" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("SubLedger");
    const baseCols = ["DateEntry", "ReceiptNo", "IDNo", "ClassRollNo", "UniRollNo", "StudentName", "FatherName", "ModeOfPayment"];
    sheet.addRow([...baseCols, ...data.columns, "Total"]);
    sheet.getRow(1).font = { bold: true };

    data.rows.forEach((r) => {
      sheet.addRow([
        r.DateEntry ? new Date(r.DateEntry).toLocaleDateString("en-GB") : "",
        r.ReceiptNo, r.IDNo, r.ClassRollNo, r.UniRollNo, r.StudentName, r.FatherName, r.ModeOfPayment,
        ...data.columns.map((h) => r.heads[h] || 0),
        r.Total,
      ]);
    });

    const totalRow = sheet.addRow([
      "", "", "", "", "", "", "", "Total",
      ...data.columns.map((h) => data.totalsRow.heads[h] || 0),
      data.totalsRow.Total,
    ]);
    totalRow.font = { bold: true };
    sheet.columns.forEach((c) => { c.width = 16; });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=FeeSubLedgerDetail.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { courses, batches, semesters, sessions, subLedgerHeads, display, exportData };