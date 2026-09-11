const { sql, withRetry } = require("../config/db");

async function getLedgerNamesForCollege(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT DISTINCT LedgerName FROM MasterLedgers WHERE CollegeName = @collegeName`);
    const names = result.recordset.map((r) => r.LedgerName);
    names.push("B/S"); // matches VB's cmbLedgerName.Items.Add("B/S")
    return names;
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

async function getCollegeAddress(collegeName) {
  return withRetry(async (pool) => {
    // Adjust table/columns to whatever frmdebit.GetAddressLine1/2 actually reads from
    const result = await pool.request()
      .input("collegeName", sql.VarChar, collegeName)
      .query(`SELECT AddressLine1, AddressLine2 FROM Colleges WHERE CollegeName = @collegeName`);
    const row = result.recordset[0];
    return { addressLine1: row?.AddressLine1 ?? "", addressLine2: row?.AddressLine2 ?? "" };
  });
}

async function getConcessionReport(collegeName, ledgerName, batch, session) {
  return withRetry(async (pool) => {
    const request = pool.request().input("collegeName", sql.VarChar, collegeName);

    let where = `WHERE CollegeName = @collegeName AND ConcessionEntry = 'Yes'`;

    if (ledgerName) {
      if (ledgerName === "B/S") {
        where += ` AND BrotherSis = 'Yes'`;
      } else {
        request.input("ledgerName", sql.VarChar, ledgerName);
        where += ` AND LedgerName = @ledgerName`;
      }
    }
    if (batch) {
      request.input("batch", sql.VarChar, batch);
      where += ` AND Batch = @batch`;
    }
    if (session) {
      request.input("session", sql.VarChar, session);
      where += ` AND Session = @session`;
    }

    const query = `
      SELECT RegistrationNo, IDNo, UniRollNo, StudentName, Class, LedgerName,
             SUM(Debit) AS ConcessionGiven, Particulars
      FROM Ledger
      ${where}
      GROUP BY IDNo, RegistrationNo, UniRollNo, StudentName, Class, LedgerName, Particulars
    `;

    const result = await request.query(query);
    const rows = result.recordset.map((r) => ({
      ...r,
      ConcessionGiven: r.ConcessionGiven ?? 0, // mirrors VB's IsDBNull -> 0 check
    }));

    const totalConcessionAmount = rows.reduce((sum, r) => sum + Number(r.ConcessionGiven), 0);

    return { rows, totalConcessionAmount, totalStudents: rows.length };
  });
}

module.exports = { getLedgerNamesForCollege, getBatchesForCollege, getCollegeAddress, getConcessionReport };