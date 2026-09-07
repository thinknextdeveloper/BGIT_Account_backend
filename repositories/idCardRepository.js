const { sql, getPool } = require("../config/db");

const tableFor = (type) => (type === "Registration" ? "Registration" : "Admissions");
const keyColFor = (type) => (type === "Registration" ? "RegistrationNo" : "IDNo");

/* ------------------------------------------------------------------ */
/*  Display() — mirrors frmWebCam.Display()                            */
/* ------------------------------------------------------------------ */

const getStudent = async (type, idNo) => {
  const pool = await getPool();
  const table = tableFor(type);
  const keyCol = keyColFor(type);

  const result = await pool
    .request()
    .input("IDNo", sql.VarChar, idNo)
    .query(`
      SELECT
        ${keyCol} AS KeyNo, CollegeName, Course, Batch, StudentName, FatherName,
        Facility, BusFee, HostelCharges, CardIssued, CardIssuedDate,
        ValidUpTo, ValidFor, PermanentAddress, HostelName, BusRoute, RouteID,
        Stopage, ClassRollNo, FatherMobileNo, PhoneNo, MotherMobileNo, StudentMobileNo
      FROM ${table}
      WHERE ${keyCol} = @IDNo
    `);

  return result.recordset[0] || null;
};

/* ------------------------------------------------------------------ */
/*  cmbSemester population — "select Distinct Semester,SemesterID      */
/*  from Ledger where IDNo=... And TransactionType='Credit'            */
/*  [And LedgerName='Bus'/'Hostel'] order by SemesterID Desc"          */
/* ------------------------------------------------------------------ */

const getSemesters = async (type, idNo, facility) => {
  const pool = await getPool();
  const keyCol = keyColFor(type);

  let query = `
    SELECT DISTINCT Semester, SemesterID
    FROM Ledger
    WHERE ${keyCol} = @IDNo AND TransactionType = 'Credit'
  `;
  if (facility === "Bus") query += ` AND LedgerName = 'Bus'`;
  else if (facility === "Hostel") query += ` AND LedgerName = 'Hostel'`;
  query += ` ORDER BY SemesterID DESC`;

  const result = await pool.request().input("IDNo", sql.VarChar, idNo).query(query);
  return result.recordset;
};

/* ------------------------------------------------------------------ */
/*  DataGridView1 rows — "select DateEntry,Semester,LedgerName,        */
/*  Particulars,Debit,Credit from Ledger where IDNo=... And LedgerName */
/*  IN ('Hostel','Bus') And CollegeName=..."                           */
/* ------------------------------------------------------------------ */

const getLedgerRows = async (type, idNo, collegeName) => {
  const pool = await getPool();
  const keyCol = keyColFor(type);

  const result = await pool
    .request()
    .input("IDNo", sql.VarChar, idNo)
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT DateEntry, Semester, LedgerName, Particulars, Debit, Credit
      FROM Ledger
      WHERE ${keyCol} = @IDNo
        AND LedgerName IN ('Hostel', 'Bus')
        AND CollegeName = @CollegeName
      ORDER BY DateEntry
    `);
  return result.recordset;
};

/* ------------------------------------------------------------------ */
/*  cmbSemester_SelectedIndexChanged — "select ValidUpTo from           */
/*  MasterHostelBusValidity where CollegeName=... and Batch=...         */
/*  And Semester=... and facility=..."                                  */
/* ------------------------------------------------------------------ */

const getValidUpTo = async (collegeName, batch, semester, facility) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("Batch", sql.NVarChar, batch)
    .input("Semester", sql.NVarChar, semester)
    .input("Facility", sql.NVarChar, facility)
    .query(`
      SELECT ValidUpTo
      FROM MasterHostelBusValidity
      WHERE CollegeName = @CollegeName AND Batch = @Batch
        AND Semester = @Semester AND Facility = @Facility
    `);
  return result.recordset[0]?.ValidUpTo || null;
};

/* ------------------------------------------------------------------ */
/*  Update() / updateValidFor() — sets CardIssued='Yes',                */
/*  CardIssuedDate=now, and either ValidUpTo (date mode) or             */
/*  ValidFor (text mode), mirroring optDate1/optText1                   */
/* ------------------------------------------------------------------ */

const setCardIssued = async (type, idNo, { validUpTo, validFor }) => {
  const pool = await getPool();
  const table = tableFor(type);
  const keyCol = keyColFor(type);

  await pool
    .request()
    .input("IDNo", sql.VarChar, idNo)
    .input("CardIssued", sql.VarChar, "Yes")
    .input("CardIssuedDate", sql.DateTime, new Date())
    .input("ValidUpTo", sql.DateTime, validUpTo || null)
    .input("ValidFor", sql.VarChar, validFor || null)
    .query(`
      UPDATE ${table}
      SET CardIssued = @CardIssued, CardIssuedDate = @CardIssuedDate,
          ValidUpTo = @ValidUpTo, ValidFor = @ValidFor
      WHERE ${keyCol} = @IDNo
    `);
};

/* ------------------------------------------------------------------ */
/*  SaveImagetoDataBase() — "update Admissions/Registration set         */
/*  Snap=@Snap where IDNo/RegistrationNo=..."                           */
/* ------------------------------------------------------------------ */

const saveSnap = async (type, idNo, buffer) => {
  const pool = await getPool();
  const table = tableFor(type);
  const keyCol = keyColFor(type);

  await pool
    .request()
    .input("IDNo", sql.VarChar, idNo)
    .input("Snap", sql.VarBinary(sql.MAX), buffer)
    .query(`UPDATE ${table} SET Snap = @Snap WHERE ${keyCol} = @IDNo`);
};

const getSnap = async (type, idNo) => {
  const pool = await getPool();
  const table = tableFor(type);
  const keyCol = keyColFor(type);

  const result = await pool
    .request()
    .input("IDNo", sql.VarChar, idNo)
    .query(`SELECT Snap FROM ${table} WHERE ${keyCol} = @IDNo`);
  return result.recordset[0]?.Snap || null;
};

module.exports = {
  getStudent,
  getSemesters,
  getLedgerRows,
  getValidUpTo,
  setCardIssued,
  saveSnap,
  getSnap,
};