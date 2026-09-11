const { sql, withRetry } = require("../config/db");

async function getAllColleges() {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .query(`SELECT DISTINCT CollegeName FROM MasterCourses ORDER BY CollegeName ASC`);
    return result.recordset.map((r) => r.CollegeName);
  });
}

async function getCoursesForCollege(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Course FROM MasterCourses WHERE CollegeName = @collegeName ORDER BY Course ASC`);
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

async function getSemestersForCollege(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT Semester FROM MasterCourses WHERE CollegeName = @collegeName AND Semester NOT IN ('Internship')`);
    return result.recordset.map((r) => r.Semester);
  });
}

module.exports = { getAllColleges, getCoursesForCollege, getBatchesForCollege, getSemestersForCollege };