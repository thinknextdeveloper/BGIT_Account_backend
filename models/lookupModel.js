const { sql, getPool } = require("../config/db");

// Mirrors cmbcollege_Click -> frmdebit.FillCollege(cmbcollege)
async function getColleges() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName`);
  return result.recordset.map((r) => r.CollegeName);
}

// Mirrors ShowCourse() — distinct courses that have ledger activity for the college
async function getCourses(collegeName) {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  const result = await request.query(
    `SELECT DISTINCT Course FROM Ledger WHERE CollegeName = @CollegeName ORDER BY Course`
  );
  return result.recordset.map((r) => r.Course);
}

// Mirrors ShowBatch()
async function getBatches(collegeName, course) {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  let query = `SELECT DISTINCT Batch FROM Ledger WHERE CollegeName = @CollegeName`;
  if (course) {
    request.input("Course", sql.VarChar, course);
    query += ` AND Course = @Course`;
  }
  query += ` ORDER BY Batch`;
  const result = await request.query(query);
  return result.recordset.map((r) => r.Batch);
}

// Mirrors showsemester() — used by the "Print All" panel
async function getSemestersForBatch(collegeName, course, batch) {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  let query = `SELECT DISTINCT Semester FROM Ledger WHERE CollegeName = @CollegeName`;
  if (course) {
    request.input("Course", sql.VarChar, course);
    query += ` AND Course = @Course`;
  }
  if (batch) {
    request.input("Batch", sql.VarChar, batch);
    query += ` AND Batch = @Batch`;
  }
  const result = await request.query(query);
  return result.recordset.map((r) => r.Semester);
}

// Mirrors the Display1/Display2 semester logic:
//  1. All semesters that exist for this college/course/batch (mastercourses)
//  2. Whichever semester already has a Transport Charges payment on record,
//     which becomes the pre-selected value in cmbSemester1 / cmbSemester2
async function getStudentSemesters({ collegeName, course, batch, idNo, session }) {
  const pool = await getPool();

  const req1 = pool.request();
  req1.input("CollegeName", sql.VarChar, collegeName);
  req1.input("Course", sql.VarChar, course);
  req1.input("Batch", sql.VarChar, batch);
  const allSemesters = await req1.query(`
    SELECT DISTINCT Semester, SemesterID
    FROM mastercourses
    WHERE CollegeName = @CollegeName AND Course = @Course AND Batch = @Batch
    ORDER BY SemesterID DESC
  `);

  const req2 = pool.request();
  req2.input("IDNo", sql.VarChar, idNo);
  req2.input("Session", sql.VarChar, session);
  req2.input("CollegeName", sql.VarChar, collegeName);
  const paidSemester = await req2.query(`
    SELECT Semester, SemesterID
    FROM Ledger
    WHERE TransactionID IN (
      SELECT TransactionID FROM SubLedgers
      WHERE TransactionID IN (
        SELECT TransactionID FROM Ledger WHERE IDNo = @IDNo AND Session = @Session
      )
      AND Subhead = 'Transport Charges' AND Credit > 0 AND CollegeName = @CollegeName
    )
    AND CollegeName = @CollegeName
    ORDER BY SemesterID DESC
  `);

  return {
    semesters: allSemesters.recordset,
    selectedSemester: paidSemester.recordset[0]?.Semester || allSemesters.recordset[0]?.Semester || "",
  };
}

// Mirrors cmbSemester1/2_SelectedIndexChanged -> MasterHostelBusValidity lookup
async function getValidUpTo({ collegeName, batch, semester, facility }) {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Batch", sql.VarChar, batch);
  request.input("Semester", sql.VarChar, semester);
  request.input("Facility", sql.VarChar, facility);
  const result = await request.query(`
    SELECT ValidUpTo
    FROM MasterHostelBusValidity
    WHERE CollegeName = @CollegeName AND Batch = @Batch AND Semester = @Semester AND Facility = @Facility
  `);
  return result.recordset[0]?.ValidUpTo || null;
}

module.exports = {
  getColleges,
  getCourses,
  getBatches,
  getSemestersForBatch,
  getStudentSemesters,
  getValidUpTo,
};