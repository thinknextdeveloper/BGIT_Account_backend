const { sql, getPool } = require("../config/db");

async function getCourses(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Course FROM MasterCourse WHERE CollegeName = @collegeName`);
  return result.recordset.map((r) => r.Course);
}

async function getBatches(collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("collegeName", sql.VarChar, collegeName)
    .query(`SELECT DISTINCT Batch FROM MasterCourse WHERE CollegeName = @collegeName`);
  return result.recordset.map((r) => r.Batch);
}

async function getPendingRegistrationFee({ collegeName, course, batch }) {
  const pool = await getPool();
  const request = pool.request().input("collegeName", sql.VarChar, collegeName);

  // TransactionType qualified as Ledger.TransactionType — it's a transaction log
  // column, most likely lives on Ledger not Registration. If verification shows
  // otherwise, swap this prefix.
  let where = `WHERE Registration.CollegeName = @collegeName AND Ledger.TransactionType = 'Credit'`;

  if (course) {
    request.input("course", sql.VarChar, course);
    where += ` AND Registration.Course = @course`;
  }
  if (batch) {
    request.input("batch", sql.Int, parseInt(batch, 10));
    where += ` AND Registration.Batch = @batch`;
  }

  const query = `
    SELECT
      Registration.RegistrationNo,
      Registration.Course,
      Registration.Batch,
      Registration.StudentName,
      Registration.FatherName,
      Registration.RegFee AS RegFee1,
      SUM(Ledger.Credit) AS Sum
    FROM Registration
    INNER JOIN Ledger
      ON Registration.CollegeName = Ledger.CollegeName
     AND Registration.RegistrationNo = Ledger.RegistrationNo
    ${where}
    GROUP BY Registration.RegistrationNo, Registration.Course, Registration.Batch,
             Registration.StudentName, Registration.FatherName, Registration.RegFee
  `;

  const result = await request.query(query);

  const rows = result.recordset.map((r) => {
    const regFee = r.RegFee1 ?? 0;
    const paid = r.Sum ?? 0;
    const balance = regFee - paid;
    return {
      RegistrationNo: r.RegistrationNo,
      Course: r.Course,
      Batch: r.Batch,
      StudentName: r.StudentName,
      FatherName: r.FatherName,
      Debit: regFee,
      Credit: paid,
      Balance: balance,
    };
  });

  return rows;
}

module.exports = { getCourses, getBatches, getPendingRegistrationFee };