const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const getFeeStructure = async (collegeName, course, batch, semester) => {
  const pool = await getPool();
  const request = pool.request();

  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Course", sql.VarChar(200), course);
  request.input("Batch", sql.Int, batch);
  request.input("Semester", sql.VarChar(50), semester);

  const result = await request.query(`
    SELECT
      [CollegeName],
      [Course],
      [Batch],
      [Semester],
      [Category],
      [ModeOfAdmission],
      [Scheme],
      [Head],
      [Amount]
    FROM [${dbName}].[dbo].[MasterAnnualFee]
    WHERE [CollegeName] = @CollegeName
      AND [Course] = @Course
      AND [Batch] = @Batch
      AND [Semester] = @Semester
  `);

  return result.recordset;
};

// const insertFeeRow = async (row) => {
//   const pool = await getPool();
//   const request = pool.request();

//   request.input("CollegeName", sql.VarChar(200), row.collegeName);
//   request.input("Course", sql.VarChar(200), row.course);
//   request.input("Batch", sql.Int, row.batch);
//   request.input("Semester", sql.VarChar(50), row.semester);
//   request.input("Category", sql.VarChar(100), row.category);
//   request.input("ModeOfAdmission", sql.VarChar(100), row.modeOfAdmission);
//   request.input("Scheme", sql.VarChar(100), row.scheme);
//   request.input("Head", sql.VarChar(100), row.head);
//   request.input("Amount", sql.Float, row.amount);

//   await request.query(`
//     INSERT INTO [${dbName}].[dbo].[MasterAnnualFee]
//     ([CollegeName], [Course], [Batch], [Semester], [Category], [ModeOfAdmission], [Scheme], [Head], [Amount])
//     VALUES
//     (@CollegeName, @Course, @Batch, @Semester, @Category, @ModeOfAdmission, @Scheme, @Head, @Amount)
//   `);
// };

const insertFeeRow = async (row) => {
  const pool = await getPool();
  const request = pool.request();

  request.input("CollegeName", sql.VarChar(200), row.CollegeName);
  request.input("Course", sql.VarChar(200), row.Course);
  request.input("Batch", sql.Int, row.Batch);
  request.input("Semester", sql.VarChar(50), row.Semester);
  request.input("Category", sql.VarChar(100), row.Category);
  request.input("ModeOfAdmission", sql.VarChar(100), row.ModeOfAdmission);
  request.input("Scheme", sql.VarChar(100), row.Scheme);
  request.input("Head", sql.VarChar(100), row.Head);
  request.input("Amount", sql.Float, row.Amount);

  await request.query(`
    INSERT INTO [${dbName}].[dbo].[MasterAnnualFee]
    ([CollegeName], [Course], [Batch], [Semester], [Category], [ModeOfAdmission], [Scheme], [Head], [Amount])
    VALUES
    (@CollegeName, @Course, @Batch, @Semester, @Category, @ModeOfAdmission, @Scheme, @Head, @Amount)
  `);
};

module.exports = {
  getFeeStructure,
  insertFeeRow,
};