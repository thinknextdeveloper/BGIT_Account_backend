const { sql, getPool } = require("../config/db");

async function getCourses(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Course FROM MasterCourse WHERE CollegeName = @collegeName`);
  return result.recordset.map((r) => r.Course);
}

async function getBatches(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Batch FROM MasterCourse WHERE CollegeName = @collegeName`);
  return result.recordset.map((r) => r.Batch);
}

async function getSubHeads(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT SubHead FROM SubLedgers WHERE CollegeName = @collegeName ORDER BY SubHead`);
  return result.recordset.map((r) => r.SubHead).filter((s) => s !== null);
}

async function getCurrentSemester(collegeName, course, batch) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .input("course", sql.VarChar, course)
    .input("batch", sql.VarChar, batch)
    .query(`
      SELECT Semester FROM MasterCurrentSemester
      WHERE CollegeName = @collegeName AND Course = @course AND Batch = @batch
    `);
  return result.recordset[0]?.Semester ?? "";
}



async function getAllSubLedgerPendingFee({ collegeName, course, batch }) {
  const pool = await getPool();
  const request = pool.request();

  request.input("CollegeName", sql.VarChar, collegeName || null);
  request.input("Course", sql.VarChar, course || null);
  request.input("Batch", sql.VarChar, batch || null);
  request.timeout = 120000;

  // Single round trip: resolve semester, then immediately call the proc
  // using that value, all inside one batch instead of two separate awaits.
  const result = await request.query(`
    DECLARE @Semester VARCHAR(50);
    SELECT TOP 1 @Semester = Semester
    FROM MasterCurrentSemester
    WHERE CollegeName = @CollegeName AND Course = @Course AND Batch = @Batch;

    EXEC AllSubLedgerPendingFee
      @CollegeName = @CollegeName,
      @Course = @Course,
      @Batch = @Batch,
      @Semester = @Semester;
  `);

  // With multiple statements, mssql returns recordsets as an array —
  // the proc's result set is the last (only) one returned here.
  const recordset = Array.isArray(result.recordsets) ? result.recordsets[result.recordsets.length - 1] : result.recordset;
  return recordset;
}


// Mirrors DisplayHeadWise(): calls SubLedgersPendingSingleSubHead.
async function getSubLedgersPendingSingleSubHead({ collegeName, course, batch, subHead, session }) {
  const pool = await getPool();

  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName || null);
  request.input("Course", sql.VarChar, course || null);
  request.input("Batch", sql.VarChar, batch || null);
  request.input("SubHead", sql.VarChar, subHead || null);
  request.input("Session", sql.VarChar, session || null);
  request.timeout = 120000;

  const result = await request.execute("SubLedgersPendingSingleSubHead");
  return result.recordset;
}

module.exports = {
  getCourses,
  getBatches,
  getSubHeads,
  getCurrentSemester,
  getAllSubLedgerPendingFee,
  getSubLedgersPendingSingleSubHead,
};