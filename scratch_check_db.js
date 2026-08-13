const { getPool } = require("./config/db");

async function checkDB() {
  try {
    const pool = await getPool();
    const college = "Bhai Gurdas College of Pharmacy, Sangrur";
    const idNo = "8925011006";

    console.log("=== RECEIPT NO TEST ===");
    const resRct = await pool.request()
      .input("CollegeName", college)
      .input("Session", "2025-26")
      .query(`
        SELECT MAX(TRY_CAST(ReceiptNo AS INT)) AS MaxFeeRct
        FROM Ledger
        WHERE CollegeName = @CollegeName AND Session = @Session AND LedgerName = 'Fee'
      `);
    console.log("Max ReceiptNo (Fee, 2025-26):", resRct.recordset[0]?.MaxFeeRct);

    const resRctAll = await pool.request()
      .input("CollegeName", college)
      .query(`
        SELECT MAX(TRY_CAST(ReceiptNo AS INT)) AS MaxFeeRct
        FROM Ledger
        WHERE CollegeName = @CollegeName AND LedgerName = 'Fee'
      `);
    console.log("Max ReceiptNo (Fee, All Sessions):", resRctAll.recordset[0]?.MaxFeeRct);

    console.log("\n=== SUBLEDGERS FOR STUDENT 8925011006 ===");
    const resSub = await pool.request()
      .input("CollegeName", college)
      .input("IDNo", idNo)
      .query(`
        SELECT l.Session, l.Semester, l.LedgerName, l.TransactionType, l.ReceiptType, s.Subhead, s.Debit, s.Credit
        FROM SubLedgers s
        INNER JOIN Ledger l ON l.CollegeName = s.CollegeName AND l.TransactionID = s.TransactionID
        WHERE l.CollegeName = @CollegeName AND l.IDNo = @IDNo
      `);
    console.table(resSub.recordset);

    console.log("\n=== STUDENT ADMISSION INFO ===");
    const resStud = await pool.request()
      .input("IDNo", idNo)
      .query(`SELECT Course, Batch, Scheme, Category, Quota, Session FROM Admissions WHERE IDNo=@IDNo`);
    console.log("Student info:", resStud.recordset[0]);

    if (resStud.recordset[0]) {
      const s = resStud.recordset[0];
      console.log("\n=== MASTER ANNUAL FEE ===");
      const resFee = await pool.request()
        .input("CollegeName", college)
        .input("Course", s.Course)
        .input("Batch", s.Batch)
        .query(`
          SELECT Head, Semester, Amount, Scheme, Category, ModeOfAdmission
          FROM MasterAnnualFee
          WHERE CollegeName=@CollegeName AND Course=@Course AND Batch=@Batch
        `);
      console.table(resFee.recordset);
    }

    process.exit(0);
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
}

checkDB();
