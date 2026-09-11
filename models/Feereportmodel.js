const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const getSessions = async () => {
  const pool = await getPool();
  const request = pool.request();

  const result = await request.query(`
    SELECT DISTINCT [Session]
    FROM [[${dbName}]
    WHERE [Session] IS NOT NULL
    ORDER BY [Session]
  `);

  return result.recordset;
};

// Dropdown list is left unrestricted by TransactionType — we want to show
// every Subhead that has EVER appeared for this college (even if only as
// a Debit/fee-structure row so far), so the person can still pick a head
// that genuinely has no payments yet and correctly see 0 records rather
// than not seeing it as an option at all.
const getLedgerNamesForCollege = async (collegeName) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  const result = await request.query(`
    SELECT DISTINCT sl.[Subhead] AS LedgerName
    FROM [${dbName}].[SubLedgers] sl
    INNER JOIN [${dbName}].[Ledger] l
      ON l.[TransactionID] = sl.[TransactionID]
     AND l.[CollegeName] = sl.[CollegeName]
    WHERE sl.[CollegeName] = @CollegeName
      AND sl.[Subhead] IS NOT NULL
    ORDER BY sl.[Subhead]
  `);

  return result.recordset.map((r) => r.LedgerName);
};

const buildBaseFilters = (request, filters, ledgerAlias = "l") => {
  const { collegeName, course, batch, semester, session, dateFrom, dateTo } = filters;

  let where = ` WHERE [${ledgerAlias}].[CollegeName] = @CollegeName `;
  request.input("CollegeName", sql.VarChar(200), collegeName);

  if (course) {
    where += ` AND [${ledgerAlias}].[Course] = @Course `;
    request.input("Course", sql.VarChar(200), course);
  }
  if (batch) {
    where += ` AND [${ledgerAlias}].[Batch] = @Batch `;
    request.input("Batch", sql.Int, batch);
  }
  if (semester) {
    where += ` AND [${ledgerAlias}].[Semester] = @Semester `;
    request.input("Semester", sql.VarChar(50), semester);
  }
  if (session) {
    where += ` AND [${ledgerAlias}].[Session] = @Session `;
    request.input("Session", sql.VarChar(20), session);
  }
  if (dateFrom && dateTo) {
    where += ` AND [${ledgerAlias}].[DateEntry] BETWEEN @DateFrom AND @DateTo `;
    request.input("DateFrom", sql.SmallDateTime, dateFrom);
    request.input("DateTo", sql.SmallDateTime, dateTo);
  }

  return where;
};

// Single sub-head selected. Only TransactionType = 'Credit' rows carry the
// actual amount paid — 'Debit' rows are the fee-structure/amount-owed
// records inserted separately and always have Credit = NULL, which is why
// the amount column was showing blank before this filter was added.
// Fixed — drop the l.LedgerName = sl.LedgerName condition
const getFeeReportSingleLedger = async (filters) => {
  const pool = await getPool();
  const request = pool.request();
  const where = buildBaseFilters(request, filters, "l");

  request.input("Subhead", sql.VarChar(100), filters.ledgerName);

  const query = `
    SELECT
      l.[TransactionID],
      l.[DateEntry],
      l.[DayBookDateEntry],
      l.[ReceiptNo],
      l.[IDNo],
      l.[ClassRollNo],
      l.[UniRollNo],
      l.[StudentName],
      l.[FatherName],
      sl.[Subhead] AS LedgerName,
      sl.[Credit] AS Amount
    FROM [${dbName}].[SubLedgers] sl
    INNER JOIN [${dbName}].[Ledger] l
      ON l.[TransactionID] = sl.[TransactionID]
     AND l.[CollegeName] = sl.[CollegeName]
    ${where}
      AND sl.[Subhead] = @Subhead
      AND sl.[TransactionType] = 'Credit'
    ORDER BY l.[DateEntry]
  `;

  const result = await request.query(query);
  return result.recordset;
};

const getDistinctSubheadsForFilters = async (filters) => {
  const pool = await getPool();
  const request = pool.request();
  const where = buildBaseFilters(request, filters, "l");

  const query = `
    SELECT DISTINCT sl.[Subhead]
    FROM [${dbName}].[dbo].[SubLedgers] sl
    INNER JOIN [${dbName}].[dbo].[Ledger] l
      ON l.[TransactionID] = sl.[TransactionID]
     AND l.[CollegeName] = sl.[CollegeName]
     AND l.[LedgerName] = sl.[LedgerName]
    ${where}
      AND sl.[Subhead] IS NOT NULL
      AND sl.[TransactionType] = 'Credit'
    ORDER BY sl.[Subhead]
  `;

  const result = await request.query(query);
  return result.recordset.map((r) => r.Subhead);
};

// All Sub Ledgers checked: pivot SubLedgers.Credit by Subhead into columns,
// grouped per transaction/receipt. Only actual payments (TransactionType
// = 'Credit') count — see comment on getFeeReportSingleLedger above.
const getFeeReportAllLedgers = async (filters) => {
  const subheads = await getDistinctSubheadsForFilters(filters);
  if (subheads.length === 0) {
    return { rows: [], ledgerColumns: [], totalsRow: null };
  }

  const pool = await getPool();
  const request = pool.request();
  const where = buildBaseFilters(request, filters, "l");

  const pivotColumns = subheads
    .map((name, i) => {
      const paramName = `Subhead${i}`;
      request.input(paramName, sql.VarChar(100), name);
      const safeAlias = name.replace(/]/g, "");
      return `SUM(CASE WHEN sl.[Subhead] = @${paramName} THEN sl.[Credit] ELSE 0 END) AS [${safeAlias}]`;
    })
    .join(",\n      ");

  const query = `
    SELECT
      l.[TransactionID],
      MAX(l.[DateEntry]) AS DateEntry,
      MAX(l.[DayBookDateEntry]) AS DayBookDateEntry,
      MAX(l.[ReceiptNo]) AS ReceiptNo,
      MAX(l.[IDNo]) AS IDNo,
      MAX(l.[ClassRollNo]) AS ClassRollNo,
      MAX(l.[UniRollNo]) AS UniRollNo,
      MAX(l.[StudentName]) AS StudentName,
      MAX(l.[FatherName]) AS FatherName,
      ${pivotColumns},
      SUM(sl.[Credit]) AS Total
    FROM [${dbName}].[dbo].[SubLedgers] sl
    INNER JOIN [${dbName}].[dbo].[Ledger] l
      ON l.[TransactionID] = sl.[TransactionID]
     AND l.[CollegeName] = sl.[CollegeName]
    ${where}
      AND sl.[TransactionType] = 'Credit'
    GROUP BY l.[TransactionID]
    ORDER BY MAX(l.[DateEntry])
  `;

  const result = await request.query(query);
  const rows = result.recordset;

  // Build the grand-total row exactly like the "Total" row in the grid
  const totalsRow = { label: "Total" };
  subheads.forEach((s) => {
    totalsRow[s] = rows.reduce((sum, r) => sum + (Number(r[s]) || 0), 0);
  });
  totalsRow.Total = rows.reduce((sum, r) => sum + (Number(r.Total) || 0), 0);

  return { rows, ledgerColumns: subheads, totalsRow };
};

module.exports = {
  getSessions,
  getFeeReportSingleLedger,
  getFeeReportAllLedgers,
  getLedgerNamesForCollege,
};