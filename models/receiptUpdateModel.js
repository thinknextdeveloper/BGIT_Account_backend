const { sql, getPool } = require("../config/db");

const getLedgerNames = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT LedgerName FROM Ledger ORDER BY LedgerName
  `);
  return result.recordset.map((r) => r.LedgerName);
};

const bulkUpdateReceipts = async ({
  collegeName,
  session,
  ledgerName,
  displayDate,
  receiptFrom,
  receiptTo,
}) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Session", sql.VarChar, session);
  request.input("LedgerName", sql.VarChar, ledgerName);
  request.input("DisplayDate", sql.Date, displayDate);
  request.input("ReceiptFrom", sql.Int, receiptFrom);
  request.input("ReceiptTo", sql.Int, receiptTo);

  const result = await request.query(`
    UPDATE Ledger
    SET DateEntry = @DisplayDate,
        LedgerName = @LedgerName
    WHERE CollegeName = @CollegeName
      AND Session = @Session
      AND ReceiptNo BETWEEN @ReceiptFrom AND @ReceiptTo
  `);

  return { rowsAffected: result.rowsAffected[0] };
};

const getMultipleHeadReport = async ({
  collegeName,
  session,
  receiptFrom,
  receiptTo,
  displayDate,
}) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Session", sql.VarChar, session);
  request.input("ReceiptFrom", sql.Int, receiptFrom);
  request.input("ReceiptTo", sql.Int, receiptTo);
  request.input("DisplayDate", sql.Date, displayDate);

  const result = await request.query(`
    SELECT LedgerName,
           SUM(Debit) AS TotalDebit,
           SUM(Credit) AS TotalCredit,
           COUNT(*) AS EntryCount
    FROM Ledger
    WHERE CollegeName = @CollegeName
      AND Session = @Session
      AND ReceiptNo BETWEEN @ReceiptFrom AND @ReceiptTo
      AND DateEntry = @DisplayDate
    GROUP BY LedgerName
    ORDER BY LedgerName
  `);

  return result.recordset;
};

const getSingleHeadReport = async ({
  collegeName,
  session,
  ledgerName,
  receiptFrom,
  receiptTo,
  displayDate,
}) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Session", sql.VarChar, session);
  request.input("LedgerName", sql.VarChar, ledgerName);
  request.input("ReceiptFrom", sql.Int, receiptFrom);
  request.input("ReceiptTo", sql.Int, receiptTo);
  request.input("DisplayDate", sql.Date, displayDate);

  const result = await request.query(`
    SELECT DateEntry, IDNo, ReceiptNo, Particulars, Debit, Credit
    FROM Ledger
    WHERE CollegeName = @CollegeName
      AND Session = @Session
      AND LedgerName = @LedgerName
      AND ReceiptNo BETWEEN @ReceiptFrom AND @ReceiptTo
      AND DateEntry = @DisplayDate
    ORDER BY ReceiptNo
  `);

  return result.recordset;
};

module.exports = {
  getLedgerNames,
  bulkUpdateReceipts,
  getMultipleHeadReport,
  getSingleHeadReport,
};