const { sql, getPool } = require("../config/db");

/**
 * Searches transactions by ReceiptNo from Ledger table.
 * @param {{receiptNo: string|number, collegeName?: string, allColleges: boolean, userColleges?: string[]}} params
 */
async function searchReceiptByNo({ receiptNo, collegeName, allColleges, userColleges }) {
  const pool = await getPool();
  const request = pool.request().input("receiptNo", sql.VarChar, String(receiptNo).trim());

  let where = `WHERE (LTRIM(RTRIM(CAST(ReceiptNo AS VARCHAR(100)))) = @receiptNo OR TRY_CAST(ReceiptNo AS INT) = TRY_CAST(@receiptNo AS INT))`;

  if (!allColleges && collegeName) {
    request.input("college", sql.VarChar, collegeName);
    where += ` AND CollegeName = @college`;
  } else if (allColleges && Array.isArray(userColleges) && userColleges.length > 0) {
    const params = userColleges.map((name, i) => {
      const p = `college${i}`;
      request.input(p, sql.VarChar, name);
      return `@${p}`;
    });
    where += ` AND CollegeName IN (${params.join(", ")})`;
  }

  const query = `
    SELECT
      Session,
      CollegeName,
      TransactionID,
      DateEntry,
      IDNo,
      UniRollNo,
      StudentName,
      FatherName,
      MotherName,
      Course,
      Class,
      Batch,
      ClassRollNo,
      Semester,
      SemesterID,
      Scheme,
      FeeCategory,
      ModeOfAdmission,
      Sex,
      OnAccountOf,
      Particulars,
      ReceiptNo,
      Debit,
      Credit,
      Balance,
      LedgerName,
      TransactionType,
      ConcessionEntry,
      ConcessionAmount,
      ChequeDraftBank,
      ChequeDraftNo,
      ChequeDraftDate,
      ModeOfPayment,
      ReceiptType,
      RegistrationNo,
      UserID,
      DisplayDate,
      Security,
      CashAmount,
      OtherAmount,
      Remarks,
      BrotherSis,
      Category,
      IsLegacy,
      SystemIP
    FROM Ledger
    ${where}
    ORDER BY DateEntry DESC, ReceiptNo ASC
  `;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchReceiptByNo };
