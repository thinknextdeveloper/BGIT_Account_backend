const fs = require('fs');
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-Q884IGA;Database=DBSmartCampusBGIET;Trusted_Connection=Yes;",
};

async function run() {
  try {
    const pool = await sql.connect(config);
    const college = "Bhai Gurdas College of Pharmacy, Sangrur";
    const idNo = "8925011006";

    const rct2025 = await pool.request()
      .input("CollegeName", college)
      .input("Session", "2025-26")
      .query("SELECT MAX(TRY_CAST(ReceiptNo AS INT)) AS MaxRct FROM Ledger WHERE CollegeName=@CollegeName AND Session=@Session AND LedgerName='Fee'");

    const sub = await pool.request()
      .input("CollegeName", college)
      .input("IDNo", idNo)
      .query(`
        SELECT l.Session, l.Semester, l.LedgerName, l.TransactionType, l.ReceiptType, s.Subhead, s.Debit, s.Credit
        FROM SubLedgers s
        INNER JOIN Ledger l ON l.CollegeName = s.CollegeName AND l.TransactionID = s.TransactionID
        WHERE l.CollegeName = @CollegeName AND l.IDNo = @IDNo
      `);

    const stud = await pool.request()
      .input("IDNo", idNo)
      .query(`SELECT Course, Batch, Scheme, Category, Quota, Session FROM Admissions WHERE IDNo=@IDNo`);

    let annual = [];
    if (stud.recordset[0]) {
      const s = stud.recordset[0];
      const resFee = await pool.request()
        .input("CollegeName", college)
        .input("Course", s.Course)
        .input("Batch", s.Batch)
        .query(`
          SELECT Head, Semester, Amount, Scheme, Category, ModeOfAdmission
          FROM MasterAnnualFee
          WHERE CollegeName=@CollegeName AND Course=@Course AND Batch=@Batch
        `);
      annual = resFee.recordset;
    }

    fs.writeFileSync('d:/NewTestAccount/bgiet/BGIT_Account_backend/debug_output.json', JSON.stringify({
      maxReceipt2025: rct2025.recordset[0]?.MaxRct,
      subledgers: sub.recordset,
      student: stud.recordset[0],
      annualFee: annual,
    }, null, 2));

    console.log("SUCCESSFULLY WRITTEN DEBUG JSON");
    process.exit(0);
  } catch (e) {
    fs.writeFileSync('d:/NewTestAccount/bgiet/BGIT_Account_backend/err.txt', e.stack || e.message);
    process.exit(1);
  }
}

run();
