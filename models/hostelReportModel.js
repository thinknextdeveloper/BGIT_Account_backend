const { sql, withRetry } = require("../config/db");

async function getHostelNames() {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .query(`SELECT DISTINCT HostelName FROM MasterHostelCharges`);
    return result.recordset.map((r) => r.HostelName);
  });
}

async function getSessions() {
  return withRetry(async (pool) => {
    const result = await pool.request().query(`SELECT * FROM MasterSession`);
    return result.recordset.map((r) => r.Session);
  });
}

async function getCoursesForCollege(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Course FROM MasterCourses WHERE CollegeName = @collegeName`);
    return result.recordset.map((r) => r.Course);
  });
}

async function getBatchesForCollege(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Batch FROM MasterCourses WHERE CollegeName = @collegeName ORDER BY Batch ASC`);
    return result.recordset.map((r) => r.Batch);
  });
}

async function getHostelReport({ collegeName, course, batch, session, hostelName }) {
  return withRetry(async (pool) => {
    const procName = session ? "NewHostelReport" : "NewHostelReportWithoutSession";
    const request = pool.request()
      .input("Collegename", sql.VarChar, collegeName || null)
      .input("Course", sql.VarChar, course || null)
      .input("Batch", sql.VarChar, batch || null)
      .input("HostelName", sql.VarChar, hostelName);

    if (session) {
      request.input("Session", sql.VarChar, session);
    }

    const result = await request.execute(procName);
    const rows = result.recordset;

    // Mirrors VB's running totals from METRollNo/AIEEERollNo columns
    let totalCredit = 0;
    let totalDebit = 0;
    for (const row of rows) {
      if (row.METRollNo != null) {
        totalCredit += Number(row.METRollNo) || 0;
        totalDebit += Number(row.AIEEERollNo) || 0;
      }
    }
    const balance = totalDebit - totalCredit;

    return { rows, totalCredit, totalDebit, balance, totalStudents: rows.length };
  });
}

async function getHostelPendingReport({ collegeName, course, batch, session, hostelName }) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("Collegename", sql.VarChar, collegeName || null)
      .input("Course", sql.VarChar, course || null)
      .input("Batch", sql.VarChar, batch || null)
      .input("Session", sql.VarChar, session || null)
      .input("HostelName", sql.VarChar, hostelName)
      .execute("NewHostelPendingReport");

    return { rows: result.recordset, totalStudents: result.recordset.length };
  });
}

module.exports = {
  getHostelNames,
  getSessions,
  getCoursesForCollege,
  getBatchesForCollege,
  getHostelReport,
  getHostelPendingReport,
};