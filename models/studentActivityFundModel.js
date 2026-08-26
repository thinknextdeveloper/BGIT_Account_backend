const { sql, withRetry } = require("../config/db");

const FUND_COLUMNS = [
  "StudentFund", "AnnualCultureFund", "AudioVisual", "CommonRoom", "LibraryFund",
  "MagazineCharge", "NCCNSS", "CycleScooterCharge", "MedicalFund", "DrawingBoard",
  "GeneralMaintenance", "Recreation", "StudentChapter", "StationeryCharge",
  "ValedictoryFund", "IdentityCard", "RefundableSecurity", "Total",
];

// in studentActivityFundModel.js, replace CollegeName = @collegeName with:
async function getCourses(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName.trim())
      .query(`SELECT DISTINCT Course FROM StudentActivityFund WHERE LTRIM(RTRIM(CollegeName)) = LTRIM(RTRIM(@collegeName))`);
    return result.recordset.map((r) => r.Course);
  });
}

async function getSemesters(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Semester, SemesterID FROM StudentActivityFund WHERE CollegeName = @collegeName ORDER BY SemesterID`);
    return result.recordset.map((r) => r.Semester);
  });
}

async function getBatches(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Batch FROM StudentActivityFund WHERE CollegeName = @collegeName`);
    return result.recordset.map((r) => r.Batch);
  });
}

async function getCurrentSession() {
  return withRetry(async (pool) => {
    // Mirrors frmdebit.ShowSession — adjust table/column if your "current session"
    // logic actually lives elsewhere (e.g. a flag column on MasterSession).
    const result = await pool.request().query(`SELECT TOP 1 Session FROM MasterSession ORDER BY Session DESC`);
    return result.recordset[0]?.Session ?? "";
  });
}

async function getStudentActivityFundReport({ collegeName, course, batch, semester, dateFrom, dateTo }) {
  return withRetry(async (pool) => {
    const session = await getCurrentSession();

    const request = pool.request()
      .input("session", sql.VarChar, session)
      .input("collegeName", sql.VarChar, collegeName);

    let where = `WHERE Session = @session AND CollegeName = @collegeName`;

    if (dateFrom && dateTo) {
      request.input("dateFrom", sql.Date, dateFrom);
      request.input("dateTo", sql.Date, dateTo);
      where += ` AND ReceiptDate BETWEEN @dateFrom AND @dateTo`;
    }
    if (course) {
      request.input("course", sql.VarChar, course);
      where += ` AND Course = @course`;
    }
    if (batch) {
      request.input("batch", sql.VarChar, batch);
      where += ` AND Batch = @batch`;
    }
    if (semester) {
      request.input("semester", sql.VarChar, semester);
      where += ` AND Semester = @semester`;
    }

    const query = `
      SELECT Session, ReceiptDate, ReceiptNo, IDNo, StudentName, Scheme, Category,
             StudentFund, AnnualCultureFund, AudioVisual, CommonRoom, LibraryFund,
             MagazineCharge, NCCNSS, CycleScooterCharge, MedicalFund, DrawingBoard,
             GeneralMaintenance, Recreation, StudentChapter, StationeryCharge,
             ValedictoryFund, IdentityCard, RefundableSecurity, Total
      FROM StudentActivityFund
      ${where}
      ORDER BY ReceiptDate
    `;

    const result = await request.query(query);
    const rows = result.recordset;

    // Mirrors VB's totals row: sums each fund column across all rows
    const totals = {};
    for (const col of FUND_COLUMNS) {
      totals[col] = rows.reduce((sum, r) => sum + (Number(r[col]) || 0), 0);
    }

    return { rows, totals, totalRecords: rows.length, session };
  });
}

module.exports = {
  getCourses, getSemesters, getBatches, getCurrentSession,
  getStudentActivityFundReport, FUND_COLUMNS,
};