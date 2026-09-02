const { sql, getPool } = require("../config/db");

// Mirrors frmdebit.FillCollege(cmbcollege)
async function getColleges() {
  const pool = await getPool();
  const result = await pool.request()
    .query(`SELECT DISTINCT CollegeName FROM MasterCourse ORDER BY CollegeName`);
  return result.recordset.map((r) => r.CollegeName);
}

// Mirrors ShowCourse() — distinct courses for the chosen college
async function getCourses(collegeName) {
  const pool = await getPool();
  const request = pool.request();
  let query = `SELECT DISTINCT Course FROM MasterCourse`;
  if (collegeName) {
    request.input("CollegeName", sql.VarChar, collegeName);
    query += ` WHERE CollegeName = @CollegeName`;
  }
  query += ` ORDER BY Course`;
  const result = await request.query(query);
  return result.recordset.map((r) => r.Course);
}

// Mirrors ShowBatch() — distinct batches for the chosen college
async function getBatches(collegeName) {
  const pool = await getPool();
  const request = pool.request();
  let query = `SELECT DISTINCT Batch FROM MasterCourse`;
  if (collegeName) {
    request.input("CollegeName", sql.VarChar, collegeName);
    query += ` WHERE CollegeName = @CollegeName`;
  }
  query += ` ORDER BY Batch`;
  const result = await request.query(query);
  return result.recordset.map((r) => r.Batch);
}

// Mirrors cmbFeeCategory_Click
async function getFeeCategories() {
  const pool = await getPool();
  const result = await pool.request()
    .query(`SELECT DISTINCT FeeCategory FROM MasterFeeCategory ORDER BY FeeCategory ASC`);
  return result.recordset.map((r) => r.FeeCategory);
}

// Mirrors cmbsession_Click
async function getSessions() {
  const pool = await getPool();
  const result = await pool.request()
    .query(`SELECT DISTINCT CurrentSession AS Session FROM MasterSession ORDER BY Session ASC`);
  return result.recordset.map((r) => r.Session);
}

// Mirrors Display4() — builds the ledger query from whichever filters were picked.
// Unlike the original VB (which fell back to an "IN (all known values)" list when a
// dropdown was left blank), an unselected filter here is simply omitted — the two are
// equivalent as long as Ledger only ever contains values that exist in the master tables.
async function getAllRecords({ collegeName, course, batch, semester, session, feeCategory }) {
  const pool = await getPool();
  const request = pool.request();

  request.input("CollegeName", sql.VarChar, collegeName || null);
  request.input("Course", sql.VarChar, course || null);
  request.input("Batch", sql.VarChar, batch || null);
  request.input("Semester", sql.VarChar, semester || null);
  request.input("Session", sql.VarChar, session || null);
  request.input("FeeCategory", sql.VarChar, feeCategory || null);
  request.timeout = 120000;

  let query = `
    SELECT CollegeName, StudentName, Course, Batch, Semester, Session, FeeCategory, Debit, Credit
    FROM Ledger
    WHERE 1 = 1
  `;

  // LTRIM/RTRIM guards against stray whitespace in stored data;
  // COLLATE ..._CI_AS makes the comparison case-insensitive.
  // Swap the collation name for whatever your DB's default collation is
  // if it isn't Latin1_General.
  const CI = "COLLATE Latin1_General_CI_AS";

  if (collegeName) query += ` AND LTRIM(RTRIM(CollegeName)) = LTRIM(RTRIM(@CollegeName)) ${CI}`;
  if (course)      query += ` AND LTRIM(RTRIM(Course)) = LTRIM(RTRIM(@Course)) ${CI}`;
  if (batch)       query += ` AND LTRIM(RTRIM(CAST(Batch AS VARCHAR(50)))) = LTRIM(RTRIM(@Batch)) ${CI}`;
  if (semester)    query += ` AND LTRIM(RTRIM(Semester)) = LTRIM(RTRIM(@Semester)) ${CI}`;
  if (session)     query += ` AND LTRIM(RTRIM(Session)) = LTRIM(RTRIM(@Session)) ${CI}`;
  if (feeCategory) query += ` AND LTRIM(RTRIM(FeeCategory)) = LTRIM(RTRIM(@FeeCategory)) ${CI}`;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { getAllRecords };

module.exports = {
  getColleges,
  getCourses,
  getBatches,
  getFeeCategories,
  getSessions,
  getAllRecords,
};