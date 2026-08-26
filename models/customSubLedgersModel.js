const { sql, getPool } = require("../config/db");

async function getCoursesByCollege(collegeName) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("college", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Course FROM Ledger WHERE CollegeName = @college`);
  return result.recordset.map((r) => r.Course);
}

async function getBatchesByCollege(collegeName) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("college", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Batch FROM Ledger WHERE CollegeName = @college`);
  return result.recordset.map((r) => r.Batch);
}

async function getSemestersByCollege(collegeName) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("college", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Semester, SemesterID FROM Ledger WHERE CollegeName = @college ORDER BY SemesterID`);
  return result.recordset.map((r) => r.Semester);
}

async function getSubHeadsByCollege(collegeName) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("college", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Head, ID FROM Masterheads WHERE CollegeName = @college ORDER BY ID`);
  return result.recordset.map((r) => r.Head);
}

async function getSessions() {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT Session FROM MasterSession ORDER BY Session DESC`);
  return result.recordset.map((r) => r.Session);
}

/**
 * @param {{collegeName, course, batch, semester, session, dateFrom, dateTo, subHeads:string[]}} params
 * subHeads is the set of checked items from CheckedListBox1 — each becomes a
 * pivoted column, same as the VB.NET grid.
 */
async function getCustomSubLedgerReport({
  collegeName,
  course,
  batch,
  semester,
  session,
  dateFrom,
  dateTo,
  subHeads,
}) {
  const pool = await getPool();
  const headerReq = pool.request().input("college", sql.VarChar, collegeName);

  let where = `WHERE TransactionType = 'Credit' AND ReceiptType = 'Multiple' AND CollegeName = @college`;
  if (dateFrom && dateTo) {
    headerReq.input("dateFrom", sql.Date, dateFrom).input("dateTo", sql.Date, dateTo);
    where += ` AND DateEntry BETWEEN @dateFrom AND @dateTo`;
  }
  if (course) {
    headerReq.input("course", sql.VarChar, course);
    where += ` AND Course = @course`;
  }
  if (batch) {
    headerReq.input("batch", sql.VarChar, batch);
    where += ` AND Batch = @batch`;
  }
  if (semester) {
    headerReq.input("semester", sql.VarChar, semester);
    where += ` AND Semester = @semester`;
  }
  if (session) {
    headerReq.input("session", sql.VarChar, session);
    where += ` AND Session = @session`;
  }

  const headerResult = await headerReq.query(`
    SELECT DateEntry, ReceiptNo, IDNo, ClassRollNo, UniRollNo, StudentName, FatherName
    FROM Ledger
    ${where}
    ORDER BY ReceiptNo
  `);
  const headerRows = headerResult.recordset;
  if (headerRows.length === 0) return { rows: [], columnTotals: {}, subHeads, totalRecords: 0 };

  // Single batched query for every (receipt, subhead) credit amount instead
  // of the VB.NET original's per-cell GetHeadvalue() lookup.
  const receiptNos = [...new Set(headerRows.map((r) => r.ReceiptNo))];
  const subReq = pool.request().input("college", sql.VarChar, collegeName);
  if (session) subReq.input("session", sql.VarChar, session);

  const receiptParams = receiptNos.map((no, i) => {
    const p = `receipt${i}`;
    subReq.input(p, sql.Int, no);
    return `@${p}`;
  });
  const headParams = subHeads.map((h, i) => {
    const p = `head${i}`;
    subReq.input(p, sql.VarChar, h);
    return `@${p}`;
  });

  const subResult = await subReq.query(`
    SELECT ReceiptNo, Subhead, Credit
    FROM SubLedgers
    WHERE CollegeName = @college
      AND TransactionType = 'Credit'
      ${session ? "AND Session = @session" : ""}
      AND ReceiptNo IN (${receiptParams.join(", ")})
      AND Subhead IN (${headParams.join(", ")})
  `);

  // creditMap[receiptNo][subhead] = credit
  const creditMap = new Map();
  for (const row of subResult.recordset) {
    if (!creditMap.has(row.ReceiptNo)) creditMap.set(row.ReceiptNo, {});
    creditMap.get(row.ReceiptNo)[row.Subhead] = Number(row.Credit) || 0;
  }

  const columnTotals = Object.fromEntries(subHeads.map((h) => [h, 0]));
  let grandTotal = 0;

  const rows = headerRows.map((r) => {
    const amounts = {};
    let rowTotal = 0;
    for (const head of subHeads) {
      const credit = creditMap.get(r.ReceiptNo)?.[head] ?? 0;
      amounts[head] = credit;
      rowTotal += credit;
      columnTotals[head] += credit;
    }
    grandTotal += rowTotal;
    return { ...r, amounts, total: rowTotal };
  });

  return { rows, columnTotals, grandTotal, subHeads, totalRecords: rows.length };
}

module.exports = {
  getCoursesByCollege,
  getBatchesByCollege,
  getSemestersByCollege,
  getSubHeadsByCollege,
  getSessions,
  getCustomSubLedgerReport,
};