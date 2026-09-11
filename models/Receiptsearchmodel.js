const { sql, getPool } = require("../config/db");

async function getLedgersByCollege(collegeName) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("college", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT LedgerName FROM MasterLedgers WHERE CollegeName = @college ORDER BY LedgerName`);
  return result.recordset.map((r) => r.LedgerName);
}

async function getSessions() {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT Session FROM MasterSession ORDER BY Session DESC`);
  return result.recordset.map((r) => r.Session);
}

/**
 * Mirrors the SQL built in frmDuplicateReceipt.btnPrint_Click. Only handles
 * Ledger.ReceiptType = 'Multiple', because that's the only branch the
 * actually-wired button in the VB.NET form supports (see note above).
 *
 * @param {{collegeName:string, ledgerName:string, session:string, receiptNo:string|number, searchType:"idNo"|"registrationNo"}} params
 */
async function getDuplicateReceipt({ collegeName, ledgerName, session, receiptNo, searchType }) {
  const pool = await getPool();
  const request = pool
    .request()
    .input("college", sql.VarChar, collegeName)
    .input("ledger", sql.VarChar, ledgerName)
    .input("session", sql.VarChar, session)
    .input("receiptNo", sql.Int, receiptNo);

  const idColumn = searchType === "registrationNo" ? "Ledger.RegistrationNo" : "Ledger.IDNo";
  const idAlias = searchType === "registrationNo" ? "RegistrationNo" : "IDNo";
  const extraCols = searchType === "idNo" ? "Ledger.ClassRollNo, Ledger.UniRollNo," : "";

  const query = `
    SELECT Ledger.Remarks, Ledger.CollegeName, ${extraCols} Ledger.StudentName, Ledger.FatherName,
           Ledger.MotherName, Ledger.Sex, Ledger.ReceiptNo, Ledger.DateEntry, ${idColumn} AS ${idAlias},
           Ledger.Course, Ledger.Batch, Ledger.Semester, Ledger.OnAccountof, Ledger.ChequeDraftBank,
           Ledger.ChequeDraftNo, CONVERT(VARCHAR(11), Ledger.ChequeDraftDate, 106) AS ChequeDraftDate,
           Ledger.ModeOfPayment, Ledger.Credit AS Credit1, Ledger.CashAmount, Ledger.OtherAmount,
           SubLedgers.Subhead, SubLedgers.Credit
    FROM Ledger, SubLedgers
    WHERE Ledger.CollegeName = SubLedgers.CollegeName
      AND Ledger.LedgerName = SubLedgers.LedgerName
      AND Ledger.Session = SubLedgers.Session
      AND Ledger.ReceiptNo = SubLedgers.ReceiptNo
      AND Ledger.CollegeName = @college
      AND Ledger.LedgerName = @ledger
      AND Ledger.ReceiptNo = @receiptNo
      AND Ledger.ReceiptType = 'Multiple'
      AND Ledger.Session = @session
  `;

  const result = await request.query(query);
  const rows = result.recordset;
  if (rows.length === 0) return null;

  const head = rows[0];
  const salutation = head.Sex === "Female" ? "D/o Mr." : "S/o Mr.";

  return {
    collegeName: head.CollegeName,
    idNo: head[idAlias] ?? "",
    course: head.Course ?? "",
    batch: head.Batch ?? "",
    classRollNo: head.ClassRollNo ?? "",
    uniRollNo: head.UniRollNo ?? "",
    dateEntry: head.DateEntry,
    studentDisplayName: `${head.StudentName ?? ""} ${salutation} ${head.FatherName ?? ""} , Mrs. ${head.MotherName ?? ""}`,
    semesterLabel: head.Semester ? `${head.Semester} Semester ( ${head.OnAccountof ?? ""} )` : "",
    receiptNo: head.ReceiptNo,
    modeOfPayment: head.ModeOfPayment ?? "",
    chequeDraftNo: head.ChequeDraftNo ?? "",
    chequeDraftBank: head.ChequeDraftBank ?? "",
    chequeDraftDate: head.ChequeDraftDate ?? "",
    cashAmount: head.CashAmount ?? 0,
    otherAmount: head.OtherAmount ?? 0,
    totalCredit: head.Credit1 ?? 0,
    remarks: head.Remarks ?? "",
    subheads: rows.map((r) => ({ subhead: r.Subhead, credit: r.Credit })),
  };
}

module.exports = { getLedgersByCollege, getSessions, getDuplicateReceipt };