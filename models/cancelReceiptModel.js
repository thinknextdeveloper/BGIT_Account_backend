const { sql, getPool } = require("../config/db");

// Coerces DB values into a valid JS Date or null — guards against empty
// strings / invalid dates that break sql.DateTime serialization (the mssql
// driver mangles these into "out-of-range" datetime conversion errors).
const toDateOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const getColleges = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName
  `);
  return result.recordset.map((r) => r.CollegeName);
};

// Mirrors VB ShowLedgerName(): distinct LedgerName from MasterLedgers
// (scoped to college) UNION ALL distinct HeadName from MasterHostelBusHeads
// (not college-scoped) — VB fills both into datasets under the same table
// name and calls ds.Merge(ds1), which just appends rows.
const getLedgerNames = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT DISTINCT LedgerName FROM MasterLedgers
      WHERE CollegeName = @CollegeName
      UNION ALL
      SELECT DISTINCT HeadName AS LedgerName FROM MasterHostelBusHeads
      ORDER BY LedgerName
    `);
  return result.recordset.map((r) => r.LedgerName);
};

// Mirrors VB btnSearch_Click: exact match on College + LedgerName + Session
// + ReceiptNo, no TransactionType filter — returns whatever Ledger row(s)
// match (normally one).
const searchReceipt = async ({ collegeName, ledgerName, session, receiptNo }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("LedgerName", sql.NVarChar, ledgerName)
    .input("Session", sql.NVarChar, session)
    .input("ReceiptNo", sql.Int, receiptNo)
    .query(`
      SELECT * FROM Ledger
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);
  return result.recordset;
};

/**
 * Mirrors VB btnAddCancelReceipt_Click:
 *  1. Re-fetch the Ledger row(s) matching the same 4-field criteria.
 *  2. Insert the first matching row into CancelledReceipt (including
 *     Comments, and CancelReceiptDate = now).
 *  3. Fetch matching SubLedgers rows and insert each into
 *     CancelledReceiptHeads.
 *  4. Delete the matching rows from Ledger and SubLedgers.
 * All wrapped in one transaction (VB ran these as separate un-transacted
 * commands — wrapping them here protects against a partial cancel if
 * something fails midway).
 */
const addCancelledReceipt = async ({
  collegeName,
  ledgerName,
  session,
  receiptNo,
  comments,
  userId,
}) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const ledgerRequest = transaction.request();
    ledgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);

    const ledgerResult = await ledgerRequest.query(`
      SELECT * FROM Ledger
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    if (ledgerResult.recordset.length === 0) {
      await transaction.rollback();
      return { success: false, message: "No Record Found" };
    }

    const row = ledgerResult.recordset[0];

    const insertRequest = transaction.request();
    insertRequest
      .input("CollegeName", sql.NVarChar, row.CollegeName ?? null)
      .input("DateEntry", sql.DateTime, toDateOrNull(row.DateEntry))
      .input("CancelReceiptDate", sql.DateTime, new Date())
      .input("IDNo", sql.BigInt, row.IDNo ?? null)
      .input("StudentName", sql.NVarChar, row.StudentName ?? null)
      .input("FatherName", sql.NVarChar, row.FatherName ?? null)
      .input("ReceiptNo", sql.Int, row.ReceiptNo ?? null)
      .input("Particulars", sql.NVarChar, row.Particulars ?? null)
      .input("Debit", sql.Decimal(18, 2), row.Debit ?? null)
      .input("Credit", sql.Decimal(18, 2), row.Credit ?? null)
      .input("LedgerName", sql.NVarChar, row.LedgerName ?? null)
      .input("ModeOfPayment", sql.NVarChar, row.ModeOfPayment ?? null)
      .input("ChequeDraftDate", sql.DateTime, toDateOrNull(row.ChequeDraftDate))
      .input("ChequeDraftNo", sql.NVarChar, row.ChequeDraftNo ?? null)
      .input("ChequeDraftBank", sql.NVarChar, row.ChequeDraftBank ?? null)
      .input("Session", sql.NVarChar, row.Session ?? null)
      .input("UserID", sql.NVarChar, userId || null)
      .input("Comments", sql.NVarChar, comments);

    await insertRequest.query(`
      INSERT INTO CancelledReceipt
        (CollegeName, DateEntry, CancelReceiptDate, IDNo, StudentName, FatherName, ReceiptNo,
         Particulars, Debit, Credit, LedgerName, ModeOfPayment,
         ChequeDraftDate, ChequeDraftNo, ChequeDraftBank, Session, UserID, Comments)
      VALUES
        (@CollegeName, @DateEntry, @CancelReceiptDate, @IDNo, @StudentName, @FatherName, @ReceiptNo,
         @Particulars, @Debit, @Credit, @LedgerName, @ModeOfPayment,
         @ChequeDraftDate, @ChequeDraftNo, @ChequeDraftBank, @Session, @UserID, @Comments)
    `);

    const subRequest = transaction.request();
    subRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);

    const subResult = await subRequest.query(`
      SELECT * FROM SubLedgers
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    for (const subRow of subResult.recordset) {
      const subInsert = transaction.request();
      subInsert
        .input("Session", sql.NVarChar, subRow.Session ?? null)
        .input("CollegeName", sql.NVarChar, subRow.CollegeName ?? null)
        .input("TransactionType", sql.NVarChar, subRow.TransactionType ?? null)
        .input("TransactionID", sql.Int, subRow.TransactionID ?? null)
        .input("LedgerName", sql.NVarChar, subRow.LedgerName ?? null)
        .input("ReceiptNo", sql.Int, subRow.ReceiptNo ?? null)
        .input("Subhead", sql.NVarChar, subRow.Subhead ?? null)
        .input("Debit", sql.Decimal(18, 2), subRow.Debit ?? null)
        .input("Credit", sql.Decimal(18, 2), subRow.Credit ?? null)
        .input("UserID", sql.NVarChar, userId || null);

      await subInsert.query(`
        INSERT INTO CancelledReceiptHeads
          (Session, CollegeName, TransactionType, TransactionID, LedgerName, ReceiptNo, Subhead, Debit, Credit, UserID)
        VALUES
          (@Session, @CollegeName, @TransactionType, @TransactionID, @LedgerName, @ReceiptNo, @Subhead, @Debit, @Credit, @UserID)
      `);
    }

    const deleteLedgerRequest = transaction.request();
    deleteLedgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);
    await deleteLedgerRequest.query(`
      DELETE FROM Ledger
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    const deleteSubRequest = transaction.request();
    deleteSubRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("LedgerName", sql.NVarChar, ledgerName)
      .input("Session", sql.NVarChar, session)
      .input("ReceiptNo", sql.Int, receiptNo);
    await deleteSubRequest.query(`
      DELETE FROM SubLedgers
      WHERE CollegeName = @CollegeName
        AND LedgerName = @LedgerName
        AND Session = @Session
        AND ReceiptNo = @ReceiptNo
    `);

    await transaction.commit();
    return { success: true, message: "Receipt has been cancelled successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Mirrors VB Display(): CancelledReceipt rows within a date range, ordered
 * by DateEntry descending. VB scopes this to the logged-in user's
 * privileged colleges (Module1.GetCollege()) rather than the search combo
 * — since that permission system isn't ported here, collegeName is an
 * OPTIONAL filter: pass it to scope to one college, omit it to see all.
 */
const getCancelledReceipts = async ({ collegeName, dateFrom, dateTo }) => {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT *, CONVERT(varchar, DateEntry, 101) AS DateDisplay
    FROM CancelledReceipt
    WHERE DateEntry BETWEEN @DateFrom AND @DateTo
  `;
  request.input("DateFrom", sql.DateTime, dateFrom);
  request.input("DateTo", sql.DateTime, dateTo);

  if (collegeName) {
    query += ` AND CollegeName = @CollegeName`;
    request.input("CollegeName", sql.NVarChar, collegeName);
  }

  query += ` ORDER BY DateEntry DESC`;

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  getColleges,
  getLedgerNames,
  searchReceipt,
  addCancelledReceipt,
  getCancelledReceipts,
};