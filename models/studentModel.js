const { sql, getPool } = require("../config/db");

const CURRENT_SESSION = "2025-26";

// Mirrors Display1(varidno) / Display2(varidno). "type" is "IDNo" or "Registration",
// matching rdbtnIDNo / rdbtnRegistration in the original form.
async function getStudent(type, idNo) {
  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.VarChar, idNo);

  const table = type === "Registration" ? "Registration" : "Admissions";
  const keyCol = type === "Registration" ? "RegistrationNo" : "IDNo";

  const result = await request.query(`
    SELECT CollegeName, Course, Batch, StudentName, FatherName, Facility, Snap,
           BusRoute, Stopage, FeeCategory
    FROM ${table}
    WHERE ${keyCol} = @IDNo
  `);

  const row = result.recordset[0];
  if (!row) {
    return { found: false };
  }
  if (!row.Facility) {
    return { found: true, noFacility: true, student: row };
  }

  return { found: true, noFacility: false, student: row };
}

// Mirrors: sqlcheck = "Select * from SubLedgers where ... Subhead='Transport Charges'/'Hostel Charges'
// and Credit>0 ..." — decides whether the "Free Pass" checkbox is available/forced,
// and (further down) whether there's a fee row to justify printing at all.
async function hasFeePayment({ idNo, collegeName, subhead }) {
  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.VarChar, idNo);
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Subhead", sql.VarChar, subhead); // 'Transport Charges' | 'Hostel Charges'
  const result = await request.query(`
    SELECT TOP 1 1 AS found
    FROM SubLedgers
    WHERE TransactionID IN (SELECT TransactionID FROM Ledger WHERE IDNo = @IDNo)
      AND Subhead = @Subhead AND Credit > 0 AND CollegeName = @CollegeName
  `);
  return result.recordset.length > 0;
}

// Mirrors the DataGridView1/2 fill: fee entries for the chosen semester and subhead
async function getFeeRows({ idNo, collegeName, semester, subhead }) {
  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.VarChar, idNo);
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Semester", sql.VarChar, semester);
  request.input("Subhead", sql.VarChar, subhead);
  const result = await request.query(`
    SELECT Ledger.DateEntry, Ledger.Semester, SubLedgers.Subhead,
           SubLedgers.Credit AS FeeReceived
    FROM Ledger
    INNER JOIN SubLedgers ON Ledger.TransactionID = SubLedgers.TransactionID
    WHERE SubLedgers.Subhead = @Subhead
      AND SubLedgers.CollegeName = @CollegeName
      AND Ledger.Semester = @Semester
      AND SubLedgers.Credit > 0
      AND Ledger.IDNo = @IDNo
  `);
  return result.recordset;
}

module.exports = { getStudent, hasFeePayment, getFeeRows, CURRENT_SESSION };