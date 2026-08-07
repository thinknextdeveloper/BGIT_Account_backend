const { sql, getPool } = require("../config/db");

/**
 * College list for the dropdown — mirrors Module1.FillCollege(cmbCollege)
 * in the VB app. Adjust the table name if your college master lives
 * elsewhere (e.g. distinct CollegeName from Admissions).
 */
const getColleges = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName
  `);
  return result.recordset.map((r) => r.CollegeName);
};

const getLedgerNames = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT LedgerName FROM Ledger WHERE LedgerName IS NOT NULL ORDER BY LedgerName
  `);
  return result.recordset.map((r) => r.LedgerName);
};

const getModesOfPayment = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT ModeOfPayment FROM Ledger WHERE ModeOfPayment IS NOT NULL ORDER BY ModeOfPayment
  `);
  return result.recordset.map((r) => r.ModeOfPayment);
};

/**
 * Mirrors VB frmDayBook.Display(): pulls Credit-type Ledger rows within a
 * DateEntry range, optionally scoped by college / session / ledger name /
 * mode of payment. Returns rows + total credit, matching
 * txtTotalAmount.Text / lblTotalRecords.Text in the VB form.
 *
 * FIX: the VB source filters on Ledger.DateEntry everywhere (see
 * frmDayBook.Display, btnPrintDateWise_Click, btnLedgerwise_Click,
 * btnPrintReceiptnowise_Click) — there is no DayBookDateEntry column on
 * Ledger. Using that name caused:
 *   "Invalid column name 'DayBookDateEntry'"
 */
const getDayBookEntries = async (filters) => {
  const {
    collegeName,
    dateFrom,
    dateTo,
    session,
    allSessions,
    ledgerName,
    modeOfPayment,
  } = filters;

  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT
      DateEntry, ReceiptNo, IDNo, UniRollNo, StudentName, FatherName,
      Credit, ChequeDraftNo, ChequeDraftDate, ChequeDraftBank, LedgerName, Course,
      ModeOfPayment, CollegeName, Session
    FROM Ledger
    WHERE TransactionType = 'Credit'
      AND DateEntry BETWEEN @DateFrom AND @DateTo
  `;

  request.input("DateFrom", sql.DateTime, dateFrom);
  request.input("DateTo", sql.DateTime, dateTo);

  if (collegeName) {
    query += ` AND CollegeName = @CollegeName`;
    request.input("CollegeName", sql.NVarChar, collegeName);
  }

  if (!allSessions && session) {
    query += ` AND Session = @Session`;
    request.input("Session", sql.NVarChar, session);
  }

  if (ledgerName) {
    query += ` AND LedgerName = @LedgerName`;
    request.input("LedgerName", sql.NVarChar, ledgerName);
  }

  if (modeOfPayment) {
    query += ` AND ModeOfPayment = @ModeOfPayment`;
    request.input("ModeOfPayment", sql.NVarChar, modeOfPayment);
  }

  query += ` ORDER BY DateEntry ASC`;

  const result = await request.query(query);
  const rows = result.recordset;
  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.Credit) || 0), 0);

  return { rows, totalAmount, count: rows.length };
};

/**
 * Splits total credit into Cash vs non-Cash subtotals for the same
 * college/date window — mirrors the two separate SELECT SUM(Credit)
 * queries VB runs before printing (btnPrintDateWise_Click etc.).
 */
const getCashVsBankTotals = async (collegeName, dateFrom, dateTo) => {
  const pool = await getPool();

  const cashRequest = pool.request();
  cashRequest
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("DateFrom", sql.DateTime, dateFrom)
    .input("DateTo", sql.DateTime, dateTo);
  const cashResult = await cashRequest.query(`
    SELECT ISNULL(SUM(Credit), 0) AS Total FROM Ledger
    WHERE CollegeName = @CollegeName AND ModeOfPayment = 'Cash'
      AND TransactionType = 'Credit'
      AND DateEntry BETWEEN @DateFrom AND @DateTo
  `);

  const bankRequest = pool.request();
  bankRequest
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("DateFrom", sql.DateTime, dateFrom)
    .input("DateTo", sql.DateTime, dateTo);
  const bankResult = await bankRequest.query(`
    SELECT ISNULL(SUM(Credit), 0) AS Total FROM Ledger
    WHERE CollegeName = @CollegeName AND ModeOfPayment <> 'Cash'
      AND TransactionType = 'Credit'
      AND DateEntry BETWEEN @DateFrom AND @DateTo
  `);

  return {
    cashTotal: cashResult.recordset[0]?.Total ?? 0,
    bankTotal: bankResult.recordset[0]?.Total ?? 0,
  };
};

/**
 * Grouped by LedgerName — mirrors VB btnLedgerwise_Click's summary query.
 */
const getLedgerWiseSummary = async (collegeName, dateFrom, dateTo) => {
  const pool = await getPool();
  const request = pool.request();
  request
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("DateFrom", sql.DateTime, dateFrom)
    .input("DateTo", sql.DateTime, dateTo);
  const result = await request.query(`
    SELECT LedgerName, SUM(Credit) AS Credit
    FROM Ledger
    WHERE CollegeName = @CollegeName AND TransactionType = 'Credit'
      AND DateEntry BETWEEN @DateFrom AND @DateTo
    GROUP BY LedgerName
    ORDER BY LedgerName
  `);
  return result.recordset;
};

module.exports = {
  getColleges,
  getLedgerNames,
  getModesOfPayment,
  getDayBookEntries,
  getCashVsBankTotals,
  getLedgerWiseSummary,
};