const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const getAll = async () => {
  const pool = await getPool();
  const request = pool.request();

  const result = await request.query(`
    SELECT [CollegeName], [Batch], [Semester], [Facility], [ValidUpTo]
    FROM [${dbName}].[dbo].[MasterHostelBusValidity]
    ORDER BY [CollegeName], [Batch], [Semester]
  `);

  return result.recordset;
};

const getFiltered = async (collegeName, batch, semester) => {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT [CollegeName], [Batch], [Semester], [Facility], [ValidUpTo]
    FROM [${dbName}].[dbo].[MasterHostelBusValidity]
    WHERE [CollegeName] = @CollegeName
  `;
  request.input("CollegeName", sql.VarChar(200), collegeName);

  if (batch) {
    query += ` AND [Batch] = @Batch`;
    request.input("Batch", sql.Int, batch);
  }
  if (semester) {
    query += ` AND [Semester] = @Semester`;
    request.input("Semester", sql.VarChar(50), semester);
  }

  query += ` ORDER BY [CollegeName], [Batch], [Semester]`;

  const result = await request.query(query);
  return result.recordset;
};

const existsInMasterCourse = async (collegeName, batch, semester) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Batch", sql.Int, batch);
  request.input("Semester", sql.VarChar(50), semester);

  const result = await request.query(`
    SELECT TOP 1 1 AS found
    FROM [${dbName}].[dbo].[MasterCourse]
    WHERE [CollegeName] = @CollegeName AND [Batch] = @Batch AND [Semester] = @Semester
  `);

  return result.recordset.length > 0;
};

const existsDuplicate = async (collegeName, batch, semester, facility) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Batch", sql.Int, batch);
  request.input("Semester", sql.VarChar(50), semester);
  request.input("Facility", sql.VarChar(50), facility);

  const result = await request.query(`
    SELECT TOP 1 1 AS found
    FROM [${dbName}].[dbo].[MasterHostelBusValidity]
    WHERE [CollegeName] = @CollegeName AND [Batch] = @Batch
      AND [Semester] = @Semester AND [Facility] = @Facility
  `);

  return result.recordset.length > 0;
};

const insertRow = async (row) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), row.collegeName);
  request.input("Batch", sql.Int, row.batch);
  request.input("Semester", sql.VarChar(50), row.semester);
  request.input("Facility", sql.VarChar(50), row.facility);
  request.input("ValidUpTo", sql.Date, row.validUpTo);

  await request.query(`
    INSERT INTO [${dbName}].[dbo].[MasterHostelBusValidity]
    ([CollegeName], [Batch], [Semester], [Facility], [ValidUpTo])
    VALUES (@CollegeName, @Batch, @Semester, @Facility, @ValidUpTo)
  `);

  return row;
};

const updateRow = async (originalKey, newValues) => {
  const pool = await getPool();
  const request = pool.request();

  request.input("OldCollegeName", sql.VarChar(200), originalKey.collegeName);
  request.input("OldBatch", sql.Int, originalKey.batch);
  request.input("OldSemester", sql.VarChar(50), originalKey.semester);
  request.input("OldFacility", sql.VarChar(50), originalKey.facility);

  request.input("CollegeName", sql.VarChar(200), newValues.collegeName);
  request.input("Batch", sql.Int, newValues.batch);
  request.input("Semester", sql.VarChar(50), newValues.semester);
  request.input("Facility", sql.VarChar(50), newValues.facility);
  request.input("ValidUpTo", sql.Date, newValues.validUpTo);

  await request.query(`
    UPDATE [${dbName}].[dbo].[MasterHostelBusValidity]
    SET [CollegeName] = @CollegeName,
        [Batch] = @Batch,
        [Semester] = @Semester,
        [Facility] = @Facility,
        [ValidUpTo] = @ValidUpTo
    WHERE [CollegeName] = @OldCollegeName
      AND [Batch] = @OldBatch
      AND [Semester] = @OldSemester
      AND [Facility] = @OldFacility
  `);

  return newValues;
};

module.exports = {
  getAll,
  getFiltered,
  existsInMasterCourse,
  existsDuplicate,
  insertRow,
  updateRow,
};