const { sql, getPool } = require("../config/db");

// TODO: frmdebit.EntryAlreadyExist(collegeName) is an unknown permission-check
// function — stubbed as always-allowed. Replace with real logic once its
// source/table is available.
async function entryAlreadyExist(_collegeName) {
  return true;
}

async function getStudentByIdNo(idNo) {
  const pool = await getPool();
  const result = await pool.request()
    .input("idNo", sql.VarChar, idNo)
    .query(`
      SELECT CollegeName, Course, Batch, StudentName, FatherName, Facility, Snap
      FROM Admissions
      WHERE IDNo = @idNo
    `);
  const row = result.recordset[0];
  if (!row) return null;

  return {
    collegeName: row.CollegeName ?? "",
    course: row.Course ?? "",
    batch: row.Batch ?? "",
    studentName: row.StudentName ?? "",
    fatherName: row.FatherName ?? "",
    facility: row.Facility ?? "", // "Bus" | "Hostel" | "None"
    snapBase64: row.Snap ? Buffer.from(row.Snap).toString("base64") : null,
  };
}

// facility comes from the SAME student whose radio button drives the filter —
// caller decides which student's facility to pass in (see bug #1 above).
async function getSemesters(idNo, facility) {
  const pool = await getPool();
  const request = pool.request().input("idNo", sql.VarChar, idNo);

  let where = `WHERE IDNo = @idNo AND TransactionType = 'Credit'`;
  if (facility === "Bus" || facility === "Hostel") {
    where += ` AND LedgerName = 'Fee'`;
  }

  const result = await request.query(`
    SELECT DISTINCT Semester, SemesterID
    FROM Ledger
    ${where}
    ORDER BY SemesterID DESC
  `);
  return result.recordset.map((r) => r.Semester);
}

// collegeName comes from whichever student's college the caller passes —
// caller decides (see bug #2 above).
async function getLedgerEntries(idNo, collegeName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("idNo", sql.VarChar, idNo)
    .input("collegeName", sql.VarChar, collegeName)
    .query(`
      SELECT DateEntry, Semester, LedgerName, Particulars, Debit, Credit
      FROM Ledger
      WHERE IDNo = @idNo AND LedgerName IN ('Hostel', 'Bus') AND CollegeName = @collegeName
    `);
  return result.recordset;
}

const REPORT_TEMPLATE_MAP = {
  "Bhai Gurdas Institute of Engineering & Technology": { bus: "rptBusPassDynamicBGIET", hostel: "rptHostelPassBGIET" },
  "Bhai Gurdas Polytechnic College": { bus: "rptBusPassDynamicBGPC", hostel: "rptHostelPassBGPC" },
  "Bhai Gurdas Institute of Management & Technology": { bus: "rptBusPassDynamicBGIMT", hostel: "rptHostelPassBGIMT" },
};

async function getPrintData({ idNos, srNos, collegeName, facility }) {
  const template = REPORT_TEMPLATE_MAP[collegeName];
  // Unmapped college -> VB leaves obj1 as Nothing and crashes on SetDataSource;
  // we surface this explicitly instead.
  if (!template) {
    const err = new Error(`No print template mapped for college "${collegeName}"`);
    err.code = "NO_TEMPLATE";
    throw err;
  }
  if (facility !== "Bus" && facility !== "Hostel") {
    const err = new Error("Please select Facility between Bus/Hostel");
    err.code = "NO_FACILITY";
    throw err;
  }

  const pool = await getPool();
  const idNoList = idNos.map((_, i) => `@idNo${i}`).join(", ");
  const srNoList = srNos.map((_, i) => `@srNo${i}`).join(", ");
  const request = pool.request();
  idNos.forEach((id, i) => request.input(`idNo${i}`, sql.VarChar, id));
  srNos.forEach((sr, i) => request.input(`srNo${i}`, sql.VarChar, sr));

  const query = `
    SELECT
      PrintedHostelBusPass.SrNo, PrintedHostelBusPass.IDNo, PrintedHostelBusPass.StudentName,
      PrintedHostelBusPass.CollegeName, PrintedHostelBusPass.Course, PrintedHostelBusPass.Batch,
      PrintedHostelBusPass.Semester,
      CASE
        WHEN PrintedHostelBusPass.Validupto IS NOT NULL THEN CONVERT(varchar(11), PrintedHostelBusPass.Validupto, 106)
        WHEN PrintedHostelBusPass.Validfor IS NOT NULL THEN PrintedHostelBusPass.Validfor
      END AS validFor,
      PrintedHostelBusPass.FatherName, PrintedHostelBusPass.PassType, Admissions.Facility,
      Admissions.BusRoute, Admissions.RouteID + '(College to ' + Admissions.BusRoute + ')' AS Route,
      Admissions.Stopage, Admissions.StopageID, Admissions.HostelName, Admissions.RoomType,
      Admissions.HostelCharges, Admissions.BusFee, Admissions.Snap,
      Admissions.PermanentAddress AS Address, Admissions.StudentMobileNo AS ContactNo,
      Admissions.Batch, Admissions.Course AS Class, CAST(Admissions.ClassRollNo AS VARCHAR) AS RollNo
    FROM PrintedHostelBusPass
    INNER JOIN Admissions
      ON Admissions.IDNo = PrintedHostelBusPass.IDNo
     AND PrintedHostelBusPass.CollegeName = Admissions.CollegeName
    WHERE PrintedHostelBusPass.IDNo IN (${idNoList})
      AND PrintedHostelBusPass.SrNo IN (${srNoList})
  `;

  const result = await request.query(query);
  const rows = result.recordset.map((r) => ({
    ...r,
    Snap: r.Snap ? Buffer.from(r.Snap).toString("base64") : null,
  }));

  return { rows, template: facility === "Bus" ? template.bus : template.hostel };
}

module.exports = {
  entryAlreadyExist,
  getStudentByIdNo,
  getSemesters,
  getLedgerEntries,
  getPrintData,
};