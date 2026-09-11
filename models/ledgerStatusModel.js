const { sql, withRetry } = require("../config/db");

// Builds the base filtered query — this is the one SQL block that appears
// (nearly identically) throughout the VB file for the "ID No." + no-fee-filter path.
function buildBaseQuery({ collegeName, course, batch, feeCategories }) {
  const request = { inputs: [], where: [] };

  request.where.push("a.CollegeName = @CollegeName");
  request.inputs.push({ name: "CollegeName", type: sql.VarChar, value: collegeName });

  if (course) {
    request.where.push("a.Course = @Course");
    request.inputs.push({ name: "Course", type: sql.VarChar, value: course });
  }
  if (batch) {
    request.where.push("a.Batch = @Batch");
    request.inputs.push({ name: "Batch", type: sql.VarChar, value: batch });
  }
  if (feeCategories && feeCategories.length > 0) {
    const paramNames = feeCategories.map((_, i) => `@FeeCat${i}`);
    request.where.push(`a.FeeCategory IN (${paramNames.join(", ")})`);
    feeCategories.forEach((fc, i) => {
      request.inputs.push({ name: `FeeCat${i}`, type: sql.VarChar, value: fc });
    });
  }

  return request;
}

async function getLedgerStatusCurrent(filters) {
  return withRetry(async (pool) => {
    if (!filters.collegeName) throw new Error("Please Select College");

    const { where, inputs } = buildBaseQuery(filters);
    const req = pool.request();
    inputs.forEach((i) => req.input(i.name, i.type, i.value));

    const query = `
      SELECT a.IDNo, a.StudentName, a.FatherName, a.StudentMobileNo, a.FatherMobileNo,
             a.Category, a.Course,
             ISNULL(SUM(Credit), 0) AS Credit,
             ISNULL(SUM(Debit), 0) AS Debit,
             ISNULL(ISNULL(SUM(Debit), 0) - ISNULL(SUM(Credit), 0), 0) AS Balance
      FROM Admissions a
      JOIN Ledger L ON a.IDNo = L.IDNo
      WHERE ${where.join(" AND ")}
      GROUP BY a.IDNo, a.StudentName, a.FatherName, a.StudentMobileNo, a.FatherMobileNo, a.Category, a.Course
    `;

    const result = await req.query(query);
    return summarize(result.recordset);
  });
}

function summarize(rows) {
  const totalCredit = rows.reduce((s, r) => s + Number(r.Credit || 0), 0);
  const totalDebit = rows.reduce((s, r) => s + Number(r.Debit || 0), 0);
  return { rows, totalCredit, totalDebit, balance: totalDebit - totalCredit, totalStudents: rows.length };
}

// ---- NOT YET IMPLEMENTED — need the frmdebit.vb source for these ----
// Each of these corresponds to a VB call whose SQL I can't see:
//   DisplayLedgerStatuszerobal        -> "with zero balance" (probably a LEFT JOIN
//                                         so students with no Ledger rows still show)
//   DisplayLedgerStatusWitLeft        -> "current + left students" (needs a status/left column)
//   DisplayLedgerStatusLeftStudents   -> only withdrawn/left students
//   DisplayLedgerStatusActiveStudents / INActiveStudents -> needs the Active flag column name
//   DisplayLedgerStatusReg            -> Registration No. variant of everything above
// Tell me the relevant column(s) on Admissions (e.g. IsActive, Status, LeftDate) and
// I'll write the real queries instead of this placeholder.
async function notImplemented(name) {
  throw Object.assign(new Error(
    `${name} needs the original frmdebit.vb SQL/schema — not present in what you've shared yet.`
  ), { code: "NOT_IMPLEMENTED" });
}

const getLedgerStatusZeroBalance = () => notImplemented("DisplayLedgerStatuszerobal");
const getLedgerStatusWithLeft = () => notImplemented("DisplayLedgerStatusWitLeft");
const getLedgerStatusLeftOnly = () => notImplemented("DisplayLedgerStatusLeftStudents");
const getLedgerStatusActive = () => notImplemented("DisplayLedgerStatusActiveStudents");
const getLedgerStatusInactive = () => notImplemented("DisplayLedgerStatusINActiveStudents");
const getLedgerStatusByRegistration = () => notImplemented("DisplayLedgerStatusReg");

async function getSemesters() {
  return withRetry(async (pool) => {
    // Placeholder table name — VB calls frmdebit.GetSemester() with no visible SQL.
    const result = await pool.request().query(`SELECT DISTINCT Semester FROM MasterSemester`);
    return result.recordset.map((r) => r.Semester);
  });
}

async function getFeeCategories() {
  return withRetry(async (pool) => {
    // Matches the VB checkcategpry() sub, which is fully visible.
    const result = await pool.request()
      .query(`SELECT DISTINCT FeeCategory FROM Admissions WHERE FeeCategory IS NOT NULL ORDER BY FeeCategory`);
    return result.recordset.map((r) => r.FeeCategory);
  });
}

module.exports = {
  getLedgerStatusCurrent,
  getLedgerStatusZeroBalance,
  getLedgerStatusWithLeft,
  getLedgerStatusLeftOnly,
  getLedgerStatusActive,
  getLedgerStatusInactive,
  getLedgerStatusByRegistration,
  getSemesters,
  getFeeCategories,
};