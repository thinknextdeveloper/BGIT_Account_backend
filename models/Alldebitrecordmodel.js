const { sql, withRetry } = require("../config/db");

/**
 * Query-string filters routinely arrive as the *string* "undefined" or
 * "null" (e.g. a frontend template literal like `?batch=${batch}` where
 * `batch` is JS undefined), or as the VB combo boxes' old "select"
 * placeholder. None of those are falsy in JS, so `if (value)` lets them
 * through as real filter values — and SQL Server then fails trying to
 * convert the literal text "undefined" into an int column, exactly like:
 *   "Conversion failed when converting the varchar value 'undefined' ..."
 * Every optional filter in this file is passed through this first.
 */
function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

/**
 * Mirrors: cmbcollege.Click -> frmdebit.FillCollege(cmbcollege)
 * Distinct list of colleges a user is allowed to see.
 */
async function getColleges() {
  return withRetry(async (pool) => {
    const result = await pool.request().query(
      `SELECT DISTINCT CollegeName FROM MasterCourses ORDER BY CollegeName`
    );
    return result.recordset.map((r) => r.CollegeName);
  });
}

/**
 * Mirrors: ShowCourse()
 * Select distinct Course from MasterCourses where CollegeName=@collegeName
 */
async function getCourses(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .query(
        `SELECT DISTINCT Course FROM MasterCourses WHERE CollegeName = @collegeName ORDER BY Course`
      );
    return result.recordset.map((r) => r.Course);
  });
}

/**
 * Mirrors: ShowBatch()
 * Select distinct Batch from MasterCourses where CollegeName=@collegeName order by Batch asc
 */
async function getBatches(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .query(
        `SELECT DISTINCT Batch FROM MasterCourses WHERE CollegeName = @collegeName ORDER BY Batch ASC`
      );
    return result.recordset.map((r) => r.Batch);
  });
}

/**
 * Mirrors: frmdebit.GetFeeCategory()
 */
async function getFeeCategories() {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .query(`SELECT DISTINCT FeeCategory FROM MasterFeeCategory ORDER BY FeeCategory`);
    return result.recordset.map((r) => r.FeeCategory);
  });
}

/**
 * Mirrors: cmbsem fill — distinct semesters available for the picked
 * college (optionally narrowed further by course/batch), read off Ledger,
 * the same table Display4() itself filters against.
 */
async function getSemesters({ collegeName, course, batch }) {
  return withRetry(async (pool) => {
    const cleanCourse = cleanParam(course);
    const cleanBatch = cleanParam(batch);

    const request = pool.request().input("collegeName", sql.VarChar, cleanParam(collegeName));
    let where = `WHERE CollegeName = @collegeName`;

    if (cleanCourse) {
      request.input("course", sql.VarChar, cleanCourse);
      where += ` AND Course = @course`;
    }
    if (cleanBatch) {
      request.input("batch", sql.VarChar, cleanBatch);
      where += ` AND Batch = @batch`;
    }

    const result = await request.query(
      `SELECT DISTINCT Semester, SemesterID FROM Ledger ${where} ORDER BY SemesterID`
    );
    return result.recordset.map((r) => r.Semester);
  });
}

/**
 * Mirrors: the "Heads" load inside Display4() —
 *   Select Distinct Head, ID from Masterheads where CollegeName=... order by ID
 * These become the dynamic fee-head columns (Tuition Fee, Development Charges,
 * Hostel Charges, ...) shown in the grid.
 */
async function getHeads(collegeName) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .query(
        `SELECT DISTINCT Head, ID FROM Masterheads WHERE CollegeName = @collegeName ORDER BY ID`
      );
    return result.recordset.map((r) => r.Head);
  });
}

// Fixed leading columns of the Display4() grid, before the dynamic per-head
// columns and the two computed trailing columns.
const LEDGER_STATUS_BASE_COLUMNS = [
  "IDNo",
  "ClassRollNo",
  "UniRollNo",
  "StudentName",
  "FatherName",
];

/**
 * Mirrors: BalanceHeadAmount(varsubhead, varidno)
 * Calls the GetStudentHeadAmount stored procedure exactly as the VB form does,
 * and reads its "Balance" output column.
 */
async function getBalanceHeadAmount(pool, collegeName, idNo, subHead) {
  const result = await pool
    .request()
    .input("CollegeName", sql.VarChar, collegeName)
    .input("IDNo", sql.VarChar, String(idNo))
    .input("SubHead", sql.VarChar, subHead)
    .execute("GetStudentHeadAmount");

  const row = result.recordset[0];
  return row && row.Balance != null ? Number(row.Balance) : 0;
}

/**
 * Mirrors: Display4()
 *
 * For the selected college/course/batch/semester:
 *  1. Loads the college's fee heads (dynamic columns), same as the cmbSubLedger fill.
 *  2. Loads every student with a Credit transaction matching the filters
 *     (Ledger where TransactionType='Credit' and CollegeName/Course/Batch/Semester).
 *  3. For each student and each head, gets the head balance via
 *     BalanceHeadAmount()/GetStudentHeadAmount — these sum into
 *     "Credit Against this Semester".
 *  4. Computes "Total Pending" the same way the original does: SUM(Debit) -
 *     SUM(Credit) across ALL of that student's ledger entries (not scoped to
 *     this college/course/batch/semester — this matches the legacy query,
 *     which was never filtered beyond IDNo either).
 *
 * Validation order (college -> batch -> course -> semester) is enforced by the
 * controller, matching Display4()'s own MsgBox checks.
 */
async function getLedgerFeeStatus({ collegeName, course, batch, semester }) {
  return withRetry(async (pool) => {
    const cleanCollege = cleanParam(collegeName);
    const cleanCourse = cleanParam(course);
    const cleanBatch = cleanParam(batch);
    const cleanSemester = cleanParam(semester);

    const heads = await getHeads(cleanCollege);

    const studentRequest = pool.request().input("collegeName", sql.VarChar, cleanCollege);
    let where = `WHERE TransactionType = 'Credit' AND CollegeName = @collegeName`;

    if (cleanCourse) {
      studentRequest.input("course", sql.VarChar, cleanCourse);
      where += ` AND Course = @course`;
    }
    if (cleanBatch) {
      studentRequest.input("batch", sql.VarChar, cleanBatch);
      where += ` AND Batch = @batch`;
    }
    if (cleanSemester) {
      studentRequest.input("semester", sql.VarChar, cleanSemester);
      where += ` AND Semester = @semester`;
    }

    const studentResult = await studentRequest.query(
      `SELECT IDNo, ClassRollNo, UniRollNo, StudentName, FatherName
       FROM Ledger
       ${where}`
    );
    const students = studentResult.recordset;

    // Sequential on purpose: the ODBC (msnodesqlv8) driver doesn't handle
    // a burst of concurrent requests against one pool well — firing
    // heads x students queries in parallel (as an earlier version of this
    // function did) starves the pool and surfaces as a TimeoutError once
    // there are more than a handful of students. This is slower but
    // reliable; see the note below if you need to speed it up.
    const rows = [];
    for (const student of students) {
      const idNo = student.IDNo;

      const headBalances = [];
      for (const head of heads) {
        const balance = await getBalanceHeadAmount(pool, cleanCollege, idNo, head);
        headBalances.push([head, balance]);
      }

      const pendingResult = await pool
        .request()
        .input("idno", sql.VarChar, String(idNo))
        .query(`SELECT SUM(Debit) - SUM(Credit) AS Pending FROM Ledger WHERE IDNo = @idno`);

      const headTotals = Object.fromEntries(headBalances);
      const creditAgainstSemester = headBalances.reduce((sum, [, v]) => sum + (v || 0), 0);
      const pendingRow = pendingResult.recordset[0];
      const totalPending = pendingRow && pendingRow.Pending != null ? Number(pendingRow.Pending) : 0;

      rows.push({
        IDNo: idNo,
        ClassRollNo: student.ClassRollNo,
        UniRollNo: student.UniRollNo,
        StudentName: student.StudentName,
        FatherName: student.FatherName,
        ...headTotals,
        "Credit Against this Semester": creditAgainstSemester,
        "Total Pending": totalPending,
      });
    }

    return {
      rows,
      totalRecords: rows.length,
      columns: [...LEDGER_STATUS_BASE_COLUMNS, ...heads, "Credit Against this Semester", "Total Pending"],
    };
  });
}

// Full column list, in the same order the VB grid (FormattedGrid) builds it —
// used by the plain Admissions/CancelledAdmission listing (getAllDebitRecords),
// not the Ledger fee-status grid above.
const RECORD_COLUMNS = [
  "CollegeName",
  "Course",
  "Batch",
  "Class",
  "LateralEntry",
  "IDNo",
  "ClassRollNo",
  "UniRollNo",
  "StudentName",
  "FatherName",
  "MotherName",
  "Sex",
  "DOB",
  "FatherOccupation",
  "MotherOccupation",
  "FatherDesignation",
  "CorrespondanceAddress",
  "PermanentAddress",
  "EmailID",
  "PhoneNo",
  "StudentMobileNo",
  "FatherMobileNo",
  "MotherMobileNo",
  "Facility",
  "BusRoute",
  "RouteID",
  "Stopage",
  "StopageID",
  "HostelName",
  "RoomType",
  "HostelCharges",
  "BusFee",
  "StudentType",
  "BloodGroup",
  "Category",
  "FeeCategory",
  "Locality",
  "Medium",
  "State",
  "Religion",
  "City",
  "GroupName",
  "Village",
  "VPO",
  "PO",
  "Tehsil",
  "District",
  "GuardianAddress",
  "GuardianContactNo",
  "Nationality",
  "CardIssued",
  "CardIssuedDate",
  "ValidUpTo",
  "SmartCArdIssued",
  "SmartCArdIssuedDate",
];

// Columns that are dd/MM/yyyy formatted in the VB grid (Format(..., "dd/MM/yyyy")).
const DATE_COLUMNS = new Set(["DOB", "CardIssuedDate", "ValidUpTo", "SmartCArdIssuedDate"]);

function formatDateColumns(row) {
  const out = { ...row };
  for (const col of DATE_COLUMNS) {
    if (out[col]) {
      const d = new Date(out[col]);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        out[col] = `${dd}/${mm}/${yyyy}`;
      }
    }
  }
  return out;
}

/**
 * Mirrors: Display() (isCancelled = false, source = Admissions, date column = AdmissionDate)
 *          DisplayCancel() (isCancelled = true, source = CancelledAdmission, date column = CancellationDate)
 *
 * All filters are optional except collegeName, and are applied with parameterized
 * inputs instead of string-concatenated SQL as in the original VB code.
 */
async function getAllDebitRecords({ collegeName, course, batch, feeCategory, isCancelled }) {
  return withRetry(async (pool) => {
    const cleanCourse = cleanParam(course);
    const cleanBatch = cleanParam(batch);
    const cleanFeeCategory = cleanParam(feeCategory);

    const request = pool.request().input("collegeName", sql.VarChar, cleanParam(collegeName));

    const tableName = isCancelled ? "CancelledAdmission" : "Admissions";
    const dateColumn = isCancelled ? "CancellationDate" : "AdmissionDate";

    let where = `WHERE CollegeName = @collegeName`;

    if (cleanCourse) {
      request.input("course", sql.VarChar, cleanCourse);
      where += ` AND Course = @course`;
    }
    if (cleanBatch) {
      request.input("batch", sql.VarChar, cleanBatch);
      where += ` AND Batch = @batch`;
    }
    if (cleanFeeCategory) {
      request.input("feeCategory", sql.VarChar, cleanFeeCategory);
      // "Display()" filters with FeeCategory IN (...), "DisplayCancel()" filters
      // Category = ... — both effectively narrow by the selected fee-category dropdown.
      where += isCancelled ? ` AND Category = @feeCategory` : ` AND FeeCategory = @feeCategory`;
    }

    const query = `
      SELECT ${RECORD_COLUMNS.join(", ")}, ${dateColumn} AS EntryDate
      FROM ${tableName}
      ${where}
      ORDER BY IDNo
    `;

    const result = await request.query(query);
    const rows = result.recordset.map(formatDateColumns);

    return { rows, totalRecords: rows.length, columns: [...RECORD_COLUMNS, "EntryDate"] };
  });
}

module.exports = {
  getColleges,
  getCourses,
  getBatches,
  getFeeCategories,
  getAllDebitRecords,
  getSemesters,
  getHeads,
  getLedgerFeeStatus,
  RECORD_COLUMNS,
  cleanParam,
};