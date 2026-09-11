const { sql, getPool } = require("../config/db");

async function getLedgerNames(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT LedgerName FROM MasterLedgers WHERE CollegeName = @collegeName`);
  return result.recordset.map((r) => r.LedgerName);
}

async function getSessions() {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT Session FROM MasterSession ORDER BY Session DESC`);
  return result.recordset.map((r) => r.Session);
}

async function getRefundReport({ collegeName, ledgerName, session }) {
  const pool = await getPool();
  const request = pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .input("ledgerName", sql.VarChar, ledgerName);

  let where = `WHERE CollegeName = @collegeName AND LedgerName = @ledgerName
               AND Remarks = 'Refunded' AND TransactionType = 'Credit' AND Credit < 0`;

  if (session) {
    request.input("session", sql.VarChar, session);
    where += ` AND Session = @session`;
  }

  const query = `
    SELECT DateEntry, ReceiptNo, IDNo, UniRollNo, StudentName, FatherName, LedgerName,
           Credit, ModeOfPayment, ChequeDraftBank, ChequeDraftNo, ChequeDraftDate,
           CashAmount, OtherAmount
    FROM Ledger
    ${where}
  `;

  const result = await request.query(query);
  const rows = result.recordset;
  const totalCredit = rows.reduce((sum, r) => sum + (Number(r.Credit) || 0), 0);

  return { rows, totalCredit, totalRecords: rows.length };
}

// Export uses a narrower column set and treats LedgerName/Session as optional
// filters, matching btnexport_Click exactly.
async function getRefundExportData({ collegeName, ledgerName, session }) {
  const pool = await getPool();
  const request = pool.request().input("collegeName", sql.VarChar, collegeName);

  let where = `WHERE CollegeName = @collegeName AND Remarks = 'Refunded' AND TransactionType = 'Credit'`;

  if (ledgerName) {
    request.input("ledgerName", sql.VarChar, ledgerName);
    where += ` AND LedgerName = @ledgerName`;
  }
  if (session) {
    request.input("session", sql.VarChar, session);
    where += ` AND Session = @session`;
  }

  const query = `
    SELECT DateEntry, ReceiptNo, IDNo, StudentName, FatherName, Credit, ModeOfPayment,
           ChequeDraftBank, ChequeDraftNo, ChequeDraftDate
    FROM Ledger
    ${where}
  `;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { getLedgerNames, getSessions, getRefundReport, getRefundExportData };