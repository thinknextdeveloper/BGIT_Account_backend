const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const FUND_FIELDS = [
  "Laboratory",
  "Workshop",
  "ComputerAndPeripherals",
  "ITConnectivity",
  "CivilWorks",
  "FacultyImprovementProgram",
  "ImprovementLibraryFacilities",
  "EducationalTour",
  "DailyConsumableGoodsForPracticals",
  "Contingency",
];

const getFiltered = async (collegeName, course, batch, semester) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  let query = `
    SELECT [Session], [CollegeName], [Course], [Batch], [Semester], [SemesterID],
           [Scheme], [Category], [Laboratory], [Workshop], [ComputerAndPeripherals],
           [ITConnectivity], [CivilWorks], [FacultyImprovementProgram],
           [ImprovementLibraryFacilities], [EducationalTour],
           [DailyConsumableGoodsForPracticals], [Contingency], [Total]
    FROM [${dbName}].[dbo].[MasterDevFund]
    WHERE [CollegeName] = @CollegeName
  `;

  if (course) {
    query += ` AND [Course] = @Course`;
    request.input("Course", sql.VarChar(200), course);
  }
  if (batch) {
    query += ` AND [Batch] = @Batch`;
    request.input("Batch", sql.Int, batch);
  }
  if (semester) {
    query += ` AND [Semester] = @Semester`;
    request.input("Semester", sql.VarChar(50), semester);
  }

  const result = await request.query(query);
  return result.recordset;
};

const existsInMasterCourse = async (collegeName, course, batch, semester) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Course", sql.VarChar(200), course);
  request.input("Batch", sql.Int, batch);
  request.input("Semester", sql.VarChar(50), semester);

  const result = await request.query(`
    SELECT TOP 1 [SemesterID]
    FROM [${dbName}].[dbo].[MasterCourse]
    WHERE [CollegeName] = @CollegeName AND [Course] = @Course
      AND [Batch] = @Batch AND [Semester] = @Semester
  `);

  return result.recordset[0] || null;
};

const existsDuplicate = async (session, collegeName, course, batch, semester, scheme, category) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("Session", sql.VarChar(50), session);
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Course", sql.VarChar(200), course);
  request.input("Batch", sql.Int, batch);
  request.input("Semester", sql.VarChar(50), semester);
  request.input("Scheme", sql.VarChar(100), scheme);
  request.input("Category", sql.VarChar(100), category);

  const result = await request.query(`
    SELECT TOP 1 1 AS found
    FROM [${dbName}].[dbo].[MasterDevFund]
    WHERE [Session] = @Session AND [CollegeName] = @CollegeName AND [Course] = @Course
      AND [Batch] = @Batch AND [Semester] = @Semester
      AND [Scheme] = @Scheme AND [Category] = @Category
  `);

  return result.recordset.length > 0;
};

const calculateTotal = (row) => {
  return FUND_FIELDS.reduce((sum, field) => sum + (Number(row[field]) || 0), 0);
};

const insertRow = async (row) => {
  const pool = await getPool();
  const request = pool.request();
  const total = calculateTotal(row);

  request.input("Session", sql.VarChar(50), row.session);
  request.input("CollegeName", sql.VarChar(200), row.collegeName);
  request.input("Course", sql.VarChar(200), row.course);
  request.input("Batch", sql.Int, row.batch);
  request.input("Semester", sql.VarChar(50), row.semester);
  request.input("SemesterID", sql.Int, row.semesterId);
  request.input("Scheme", sql.VarChar(100), row.scheme);
  request.input("Category", sql.VarChar(100), row.category);

  FUND_FIELDS.forEach((field) => {
    request.input(field, sql.Float, row[field.charAt(0).toLowerCase() + field.slice(1)] || 0);
  });
  request.input("Total", sql.Float, total);

  await request.query(`
    INSERT INTO [${dbName}].[dbo].[MasterDevFund]
    ([Session], [CollegeName], [Course], [Batch], [Semester], [SemesterID], [Scheme], [Category],
     [Laboratory], [Workshop], [ComputerAndPeripherals], [ITConnectivity], [CivilWorks],
     [FacultyImprovementProgram], [ImprovementLibraryFacilities], [EducationalTour],
     [DailyConsumableGoodsForPracticals], [Contingency], [Total])
    VALUES
    (@Session, @CollegeName, @Course, @Batch, @Semester, @SemesterID, @Scheme, @Category,
     @Laboratory, @Workshop, @ComputerAndPeripherals, @ITConnectivity, @CivilWorks,
     @FacultyImprovementProgram, @ImprovementLibraryFacilities, @EducationalTour,
     @DailyConsumableGoodsForPracticals, @Contingency, @Total)
  `);

  return { ...row, total };
};

const updateRow = async (originalKey, newValues) => {
  const pool = await getPool();
  const request = pool.request();
  const total = calculateTotal(newValues);

  request.input("OldSession", sql.VarChar(50), originalKey.session);
  request.input("OldCollegeName", sql.VarChar(200), originalKey.collegeName);
  request.input("OldCourse", sql.VarChar(200), originalKey.course);
  request.input("OldBatch", sql.Int, originalKey.batch);
  request.input("OldSemester", sql.VarChar(50), originalKey.semester);
  request.input("OldScheme", sql.VarChar(100), originalKey.scheme);
  request.input("OldCategory", sql.VarChar(100), originalKey.category);

  request.input("Session", sql.VarChar(50), newValues.session);
  request.input("CollegeName", sql.VarChar(200), newValues.collegeName);
  request.input("Course", sql.VarChar(200), newValues.course);
  request.input("Batch", sql.Int, newValues.batch);
  request.input("Semester", sql.VarChar(50), newValues.semester);
  request.input("SemesterID", sql.Int, newValues.semesterId);
  request.input("Scheme", sql.VarChar(100), newValues.scheme);
  request.input("Category", sql.VarChar(100), newValues.category);

  FUND_FIELDS.forEach((field) => {
    request.input(field, sql.Float, newValues[field.charAt(0).toLowerCase() + field.slice(1)] || 0);
  });
  request.input("Total", sql.Float, total);

  await request.query(`
    UPDATE [${dbName}].[dbo].[MasterDevFund]
    SET [Session] = @Session, [CollegeName] = @CollegeName, [Course] = @Course,
        [Batch] = @Batch, [Semester] = @Semester, [SemesterID] = @SemesterID,
        [Scheme] = @Scheme, [Category] = @Category,
        [Laboratory] = @Laboratory, [Workshop] = @Workshop,
        [ComputerAndPeripherals] = @ComputerAndPeripherals, [ITConnectivity] = @ITConnectivity,
        [CivilWorks] = @CivilWorks, [FacultyImprovementProgram] = @FacultyImprovementProgram,
        [ImprovementLibraryFacilities] = @ImprovementLibraryFacilities,
        [EducationalTour] = @EducationalTour,
        [DailyConsumableGoodsForPracticals] = @DailyConsumableGoodsForPracticals,
        [Contingency] = @Contingency, [Total] = @Total
    WHERE [Session] = @OldSession AND [CollegeName] = @OldCollegeName AND [Course] = @OldCourse
      AND [Batch] = @OldBatch AND [Semester] = @OldSemester
      AND [Scheme] = @OldScheme AND [Category] = @OldCategory
  `);

  return { ...newValues, total };
};

module.exports = {
  getFiltered,
  existsInMasterCourse,
  existsDuplicate,
  insertRow,
  updateRow,
};