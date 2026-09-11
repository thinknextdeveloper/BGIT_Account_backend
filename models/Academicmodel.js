const { sql, getPool } = require("../config/db");

/* ------------------------------------------------------------------ */
/*  EduQualification grid — mirrors Display()/dgvdetail + the block    */
/*  in btnUpdate_Click that deletes-then-reinserts by IDNo             */
/* ------------------------------------------------------------------ */

const getEduQualifications = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .query(`
      SELECT SerialNo, ExamPassed, Course, SubjectsStudied, BoardUniv,
             YearOfPassing, MarksObtained, TotalMarks, Percentage, Remarks
      FROM EduQualification
      WHERE IDNo = @IDNo
      ORDER BY SerialNo ASC
    `);
  return result.recordset;
};

// rows: [{ serialNo, examPassed, course, subjectsStudied, boardUniv,
//          yearOfPassing, marksObtained, totalMarks, percentage, remarks }]
// Mirrors: delete from EduQualification where IDNo=... then re-insert
// each grid row, matching the VB update flow exactly.
const saveEduQualifications = async (idNo, rows) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const delRequest = transaction.request();
    await delRequest
      .input("IDNo", sql.BigInt, idNo)
      .query(`DELETE FROM EduQualification WHERE IDNo=@IDNo`);

    let serialNo = 1;
    for (const row of rows || []) {
      const insRequest = transaction.request();
      insRequest
        .input("IDNo", sql.BigInt, idNo)
        .input("SerialNo", sql.Int, serialNo)
        .input("ExamPassed", sql.NVarChar, row.examPassed || null)
        .input("Course", sql.NVarChar, row.course || null)
        .input("SubjectsStudied", sql.NVarChar, row.subjectsStudied || null)
        .input("BoardUniv", sql.NVarChar, row.boardUniv || null)
        .input("YearOfPassing", sql.NVarChar, row.yearOfPassing || null)
        .input("MarksObtained", sql.NVarChar, row.marksObtained || null)
        .input("TotalMarks", sql.NVarChar, row.totalMarks || null)
        .input("Percentage", sql.NVarChar, row.percentage || null)
        .input("Remarks", sql.NVarChar, row.remarks || null);

      await insRequest.query(`
        INSERT INTO EduQualification
          (IDNo, SerialNo, ExamPassed, Course, SubjectsStudied, BoardUniv,
           YearOfPassing, MarksObtained, TotalMarks, Percentage, Remarks)
        VALUES
          (@IDNo, @SerialNo, @ExamPassed, @Course, @SubjectsStudied, @BoardUniv,
           @YearOfPassing, @MarksObtained, @TotalMarks, @Percentage, @Remarks)
      `);
      serialNo += 1;
    }

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ------------------------------------------------------------------ */
/*  Document status grid — mirrors DisplayDocsRequired()/               */
/*  UpdateDocsRequired()/btnDeleteDocsRequired_Click                    */
/* ------------------------------------------------------------------ */

// Mirrors DisplayDocsRequired(): existing DocumentStatus rows if any,
// otherwise fall back to the college's MasterDocumentsRequired checklist.
const getDocumentStatus = async (idNo, collegeName) => {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .query(`
      SELECT SerialNo, DocumentsRequired, Status
      FROM DocumentStatus
      WHERE IDNo = @IDNo
      ORDER BY SerialNo ASC
    `);

  if (existing.recordset.length > 0) {
    return existing.recordset;
  }

  const fallback = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT SerialNo, DocumentsRequired
      FROM MasterDocumentsRequired
      WHERE College = @CollegeName
      ORDER BY SerialNo ASC
    `);

  return fallback.recordset.map((r) => ({ ...r, Status: "" }));
};

// Mirrors UpdateDocsRequired(): delete-then-reinsert by IDNo.
const saveDocumentStatus = async (idNo, studentName, rows) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const delRequest = transaction.request();
    await delRequest
      .input("IDNo", sql.BigInt, idNo)
      .query(`DELETE FROM DocumentStatus WHERE IDNo=@IDNo`);

    for (const row of rows || []) {
      const insRequest = transaction.request();
      insRequest
        .input("IDNo", sql.BigInt, idNo)
        .input("StudentName", sql.NVarChar, studentName || null)
        .input("SerialNo", sql.Int, row.serialNo || null)
        .input("DocumentsRequired", sql.NVarChar, row.documentsRequired || null)
        .input("Status", sql.NVarChar, row.status || null);

      await insRequest.query(`
        INSERT INTO DocumentStatus (IDNo, StudentName, SerialNo, DocumentsRequired, Status)
        VALUES (@IDNo, @StudentName, @SerialNo, @DocumentsRequired, @Status)
      `);
    }

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// Mirrors btnDeleteDocsRequired_Click
const deleteDocumentStatus = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .query(`DELETE FROM DocumentStatus WHERE IDNo=@IDNo`);
  return result.rowsAffected[0] > 0;
};

/* ------------------------------------------------------------------ */
/*  Academic-tab master/dropdown data                                  */
/* ------------------------------------------------------------------ */

// Mirrors dgvdetail_CellEnter's Course lookup
const getPreviousCourses = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT Course FROM MasterPreviousCourses ORDER BY Course`);
  return result.recordset.map((r) => r.Course);
};

// Mirrors dgvdetail_CellEnter's Board lookup
const getPreviousBoards = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT Board FROM MasterPreviousBoard ORDER BY Board`);
  return result.recordset.map((r) => r.Board);
};

// Mirrors frmdebit.ShowInstLastAttended(cmb)
const getInstitutionsLastAttended = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT InstitutionName FROM MasterInstitution ORDER BY InstitutionName`);
  return result.recordset.map((r) => r.InstitutionName);
};

module.exports = {
  getEduQualifications,
  saveEduQualifications,
  getDocumentStatus,
  saveDocumentStatus,
  deleteDocumentStatus,
  getPreviousCourses,
  getPreviousBoards,
  getInstitutionsLastAttended,
};