const { sql, withRetry } = require("../config/db");

async function getCourses(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Course FROM MasterCourses WHERE CollegeName = @collegeName`);
    return result.recordset.map((r) => r.Course);
  });
}

async function getBatches(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Batch FROM MasterCourses WHERE CollegeName = @collegeName ORDER BY Batch ASC`);
    return result.recordset.map((r) => r.Batch);
  });
}

async function getSessions() {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .query(`SELECT DISTINCT CurrentSession FROM MasterSession`);
    return result.recordset.map((r) => r.CurrentSession);
  });
}

// NOTE: verify these exact column names against your Registration table schema
// (e.g. via sp_columns Registration) — names below are best-guess from the VB grid columns.
async function getLedgerWiseStatus({ collegeName, course, batch, session, dateFrom, dateTo, mode }) {
  return withRetry(async (pool) => {
    const request = pool.request().input("collegeName", sql.VarChar, collegeName);

    let where = `WHERE l.CollegeName = @collegeName`;

    if (course && course !== "undefined" && course !== "null") {
      request.input("course", sql.VarChar, course);
      where += ` AND l.Course = @course`;
    }
    if (batch && batch !== "undefined" && batch !== "null") {
      request.input("batch", sql.VarChar, batch);
      where += ` AND l.Batch = @batch`;
    }
    if (session && session !== "undefined" && session !== "null") {
      request.input("session", sql.VarChar, session);
      where += ` AND l.Session = @session`;
    }

    const hasDateFrom = dateFrom && dateFrom !== "undefined" && dateFrom !== "null";
    const hasDateTo = dateTo && dateTo !== "undefined" && dateTo !== "null";

    if (hasDateFrom && hasDateTo) {
      const parsedFrom = new Date(dateFrom);
      const parsedTo = new Date(dateTo);

      if (isNaN(parsedFrom.getTime()) || isNaN(parsedTo.getTime())) {
        throw new Error("Invalid dateFrom/dateTo value provided.");
      }

      request.input("dateFrom", sql.DateTime, parsedFrom);
      request.input("dateTo", sql.DateTime, parsedTo);
      where += ` AND l.DateEntry BETWEEN @dateFrom AND @dateTo`;
    }

    // mode === "registration" -> RegistrationNo shown, mode === "idno" -> ClassRollNo shown
    const idColumn = mode === "registration"
      ? `r.RegistrationNo AS RegistrationNo, r.IDNo AS IDNo`
      : `r.IDNo AS IDNo, r.ClassRollNo AS ClassRollNo`;

    const query = `
      SELECT
        ${idColumn},
        r.StudentName,
        r.FatherName,
        l.LedgerName,
        l.Debit,
        l.Credit,
        (ISNULL(l.Debit,0) - ISNULL(l.Credit,0)) AS Balance
      FROM Ledger l
      INNER JOIN Registration r ON r.IDNo = l.IDNo
      ${where}
      ORDER BY r.StudentName
    `;

    const result = await request.query(query);
    const rows = result.recordset.map((r) => ({
      ...r,
      Debit: r.Debit ?? 0,
      Credit: r.Credit ?? 0,
    }));

    const totalDebits = rows.reduce((sum, r) => sum + Number(r.Debit), 0);
    const totalCredits = rows.reduce((sum, r) => sum + Number(r.Credit), 0);
    const balance = totalDebits - totalCredits;

    return { rows, totalDebits, totalCredits, balance };
  });
}

module.exports = { getCourses, getBatches, getSessions, getLedgerWiseStatus };