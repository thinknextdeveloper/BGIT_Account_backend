const { sql, withRetry } = require("../config/db");

function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

// Mirrors: ShowLedger() — SELECT DISTINCT LedgerName FROM MasterLedgers
async function getDistinctLedgers() {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .query(`SELECT DISTINCT LedgerName FROM MasterLedgers ORDER BY LedgerName`);
    return result.recordset.map((r) => r.LedgerName);
  });
}

// Mirrors: DisplayReservedReceiptNumbers() —
// SELECT Session, CollegeName, Ledger, ReceiptNo, ReceiptDate FROM ReserveReceiptNos
// WHERE Session=@session [AND CollegeName=@collegeName] ORDER BY ReceiptNo, ReceiptDate
async function listReservedReceipts(session, collegeName) {
  return withRetry(async (pool) => {
    const request = pool.request().input("session", sql.VarChar, cleanParam(session));
    let query = `SELECT Session, CollegeName, Ledger, ReceiptNo,
                        CONVERT(varchar, ReceiptDate, 103) AS ReceiptDate
                 FROM ReserveReceiptNos
                 WHERE Session = @session`;

    const college = cleanParam(collegeName);
    if (college) {
      query += " AND CollegeName = @collegeName";
      request.input("collegeName", sql.VarChar, college);
    }

    query += " ORDER BY ReceiptNo, ReceiptDate";

    const result = await request.query(query);
    return result.recordset;
  });
}

// Mirrors: checkReceiptNoExistInLedger -> CalcReceiptNoExist
// TODO: wire to your existing fee ledger receipt-number logic (same one used by
// the debit/collection screens) — this needs to check whether ReceiptNo is
// already used in the actual ledger transaction table for this college/session/ledger.
async function existsInLedger(collegeName, session, ledgerName, receiptNo) {
  throw new Error(
    "existsInLedger() not implemented — port frmdebit.CalcReceiptNoExist here."
  );
}

// Mirrors: checkReceiptNoExistInReserveReceipts -> CalcReceiptNoExistInReservedReceipts
async function existsInReservedReceipts(collegeName, session, ledgerName, receiptNo) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("session", sql.VarChar, cleanParam(session))
      .input("ledgerName", sql.VarChar, cleanParam(ledgerName))
      .input("receiptNo", sql.Int, receiptNo)
      .query(
        `SELECT ReceiptNo FROM ReserveReceiptNos
         WHERE CollegeName = @collegeName AND Session = @session
           AND Ledger = @ledgerName AND ReceiptNo = @receiptNo`
      );
    return result.recordset.length > 0;
  });
}

// Mirrors: saveReceiptNo() insert — one row per receipt number in the range
async function createReservedReceipt({ collegeName, session, ledgerName, receiptNo, receiptDate }) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("session", sql.VarChar, cleanParam(session))
      .input("ledgerName", sql.VarChar, cleanParam(ledgerName))
      .input("receiptNo", sql.Int, receiptNo)
      .input("receiptDate", sql.Date, receiptDate)
      .query(
        `INSERT INTO ReserveReceiptNos (CollegeName, Session, Ledger, ReceiptNo, ReceiptDate)
         VALUES (@collegeName, @session, @ledgerName, @receiptNo, @receiptDate)`
      );
    return result.rowsAffected[0] || 0;
  });
}

// Mirrors: cmbCollege_SelectedIndexChanged -> CalcReceiptNo / CalcAdvanceReceiptNo / CalcRefundedReceiptNo
// TODO: wire to your existing receipt-numbering rules per ledger type.
async function calcNextReceiptFrom(collegeName, ledgerName, session) {
  throw new Error(
    "calcNextReceiptFrom() not implemented — port the three frmdebit.Calc*ReceiptNo functions here, branching on ledgerName === 'AdvanceFee' / 'Refunded' / default."
  );
}

module.exports = {
  getDistinctLedgers,
  listReservedReceipts,
  existsInLedger,
  existsInReservedReceipts,
  createReservedReceipt,
  calcNextReceiptFrom,
  cleanParam,
};