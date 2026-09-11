const { sql, getPool } = require("../config/db");

async function getCourses(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Course FROM Ledger WHERE CollegeName = @collegeName AND TransactionType = 'Credit' AND Course IS NOT NULL`);
  return result.recordset.map((r) => r.Course);
}

async function getBatches(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Batch FROM Ledger WHERE CollegeName = @collegeName AND TransactionType = 'Credit' AND Batch IS NOT NULL`);
  return result.recordset.map((r) => r.Batch);
}

async function getSemesters(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Semester, SemesterID FROM Ledger WHERE CollegeName = @collegeName AND TransactionType = 'Credit' AND Semester IS NOT NULL ORDER BY SemesterID`);
  return result.recordset.map((r) => r.Semester);
}

async function getSessions() {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT Session FROM MasterSession ORDER BY Session DESC`);
  return result.recordset.map((r) => r.Session);
}

async function getSubLedgerHeads(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Head, ID FROM Masterheads WHERE CollegeName = @collegeName ORDER BY ID`);
  return result.recordset.map((r) => r.Head);
}

// Builds a safe "IN (@p0, @p1, ...)" clause and binds each value onto `request`.
function bindInList(request, values, prefix) {
  if (!values.length) return "(NULL)";
  const names = values.map((v, i) => {
    const name = `${prefix}${i}`;
    request.input(name, sql.VarChar, String(v));
    return `@${name}`;
  });
  return `(${names.join(", ")})`;
}

/**
 * Ports the VB Display()/Display1() + GetHeadvalue() flow:
 *  1. fetch matching Ledger rows,
 *  2. resolve which fee-head columns to pivot in (all heads for the
 *     college, or just the one selected),
 *  3. fetch all matching SubLedgers credit rows in one query,
 *  4. pivot in JS, compute per-row + column totals, and drop any
 *     head column whose total is 0 (equivalent to ColumnMapping = Hidden).
 */
async function getFeeSubLedgerReport({
  collegeName, course, batch, semester, session, receiptNo,
  dateFrom, dateTo, allSubLedgers, subLedgerHead,
}) {
  const pool = await getPool();
  const request = pool.request().input("collegeName", sql.VarChar, collegeName);

  let where = `WHERE CollegeName = @collegeName AND TransactionType = 'Credit'`;
  if (course) { request.input("course", sql.VarChar, course); where += ` AND Course = @course`; }
  if (batch) { request.input("batch", sql.VarChar, batch); where += ` AND Batch = @batch`; }
  if (semester) { request.input("semester", sql.VarChar, semester); where += ` AND Semester = @semester`; }
  if (session) { request.input("session", sql.VarChar, session); where += ` AND Session = @session`; }
  if (receiptNo) { request.input("receiptNo", sql.VarChar, receiptNo); where += ` AND ReceiptNo = @receiptNo`; }
  if (dateFrom) { request.input("dateFrom", sql.DateTime, new Date(dateFrom)); where += ` AND DateEntry >= @dateFrom`; }
  if (dateTo) { request.input("dateTo", sql.DateTime, new Date(dateTo)); where += ` AND DateEntry <= @dateTo`; }

  const ledgerQuery = `
    SELECT DateEntry, ReceiptNo, IDNo, ClassRollNo, UniRollNo, StudentName, FatherName,
           ModeOfPayment, TransactionID, UserID, Session
    FROM Ledger
    ${where}
    ORDER BY ReceiptNo
  `;
  const ledgerResult = await request.query(ledgerQuery);
  const ledgerRows = ledgerResult.recordset;

  if (ledgerRows.length === 0) {
    return { columns: [], rows: [], totalsRow: null, totalRecords: 0 };
  }

  let heads = [];
  if (allSubLedgers) {
    heads = await getSubLedgerHeads(collegeName);
  } else if (subLedgerHead) {
    heads = [subLedgerHead];
  }

  let creditRows = [];
  if (heads.length > 0) {
    const receiptNos = [...new Set(ledgerRows.map((r) => r.ReceiptNo))];
    const creditRequest = pool.request().input("collegeName", sql.VarChar, collegeName);
    const receiptsClause = bindInList(creditRequest, receiptNos, "r");
    const headsClause = bindInList(creditRequest, heads, "h");

    const creditQuery = `
      SELECT ReceiptNo, Subhead, Credit
      FROM SubLedgers
      WHERE CollegeName = @collegeName
        AND TransactionType = 'Credit'
        AND ReceiptNo IN ${receiptsClause}
        AND Subhead IN ${headsClause}
    `;
    const creditResult = await creditRequest.query(creditQuery);
    creditRows = creditResult.recordset;
  }

  const getCredit = (receiptNoVal, head) => {
    const found = creditRows.find((c) => c.ReceiptNo === receiptNoVal && c.Subhead === head);
    return found ? Number(found.Credit) || 0 : 0;
  };

  const pivotRows = ledgerRows.map((row) => {
    const headValues = {};
    let total = 0;
    heads.forEach((head) => {
      const val = getCredit(row.ReceiptNo, head);
      headValues[head] = val;
      total += val;
    });
    return {
      DateEntry: row.DateEntry,
      ReceiptNo: row.ReceiptNo,
      IDNo: row.IDNo,
      ClassRollNo: row.ClassRollNo,
      UniRollNo: row.UniRollNo,
      StudentName: row.StudentName,
      FatherName: row.FatherName,
      ModeOfPayment: row.ModeOfPayment,
      heads: headValues,
      Total: total,
    };
  });

  const totalsRow = { heads: {}, Total: 0 };
  heads.forEach((head) => {
    totalsRow.heads[head] = pivotRows.reduce((sum, r) => sum + (r.heads[head] || 0), 0);
  });
  totalsRow.Total = pivotRows.reduce((sum, r) => sum + r.Total, 0);

  const visibleHeads = heads.filter((head) => totalsRow.heads[head] !== 0);

  return { columns: visibleHeads, rows: pivotRows, totalsRow, totalRecords: pivotRows.length };
}

module.exports = { getCourses, getBatches, getSemesters, getSessions, getSubLedgerHeads, getFeeSubLedgerReport };