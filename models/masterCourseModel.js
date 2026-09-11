const { sql, getPool } = require("../config/db");

const tablePrefix = process.env.DB_DATABASE ? `[${process.env.DB_DATABASE}].[dbo].[MasterCourses]` : `[MasterCourses]`;

const getAllColleges = async () => {
  const pool = await getPool();
  const request = pool.request();

  const result = await request.query(`
    SELECT DISTINCT [CollegeName]
    FROM ${tablePrefix}
    WHERE [CollegeName] IS NOT NULL
    ORDER BY [CollegeName]
  `);

  return result.recordset;
};

const getCoursesByCollege = async (collegeName) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  const result = await request.query(`
    SELECT DISTINCT [Course]
    FROM ${tablePrefix}
    WHERE [CollegeName] = @CollegeName
      AND [Course] IS NOT NULL
    ORDER BY [Course]
  `);

  return result.recordset;
};

const getBatchesByCollegeAndCourse = async (collegeName, course) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  const query = `
    SELECT DISTINCT [Batch]
    FROM ${tablePrefix}
    WHERE [CollegeName] = @CollegeName
      AND [Batch] IS NOT NULL
    ORDER BY [Batch]
  `;

  const result = await request.query(query);
  return result.recordset;
};

const getSemestersByCollegeCourseBatch = async (collegeName, course, batch) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Batch", sql.Int, batch);

  const query = `
    SELECT DISTINCT [Semester], [SemesterID]
    FROM ${tablePrefix}
    WHERE [CollegeName] = @CollegeName
      AND [Batch] = @Batch
      AND [Semester] IS NOT NULL
    ORDER BY [SemesterID]
  `;

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  getAllColleges,
  getCoursesByCollege,
  getBatchesByCollegeAndCourse,
  getSemestersByCollegeCourseBatch,
};