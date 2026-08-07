const { sql, getPool } = require("../config/db");

// Reuses the same MasterCollege table as Cancel Receipt for the College dropdown.
// const getColleges = async () => {
//   const pool = await getPool();
//   const result = await pool.request().query(`
//     SELECT DISTINCT CollegeName FROM MasterCollege ORDER BY CollegeName
//   `);
//   return result.recordset.map((r) => r.CollegeName);
// };


const getColleges = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT CollegeName FROM MasterCourse ORDER BY CollegeName
  `);
  return result.recordset.map((r) => r.CollegeName);
};

// Mirrors VB ShowCourse(): distinct Course from MasterCourse, scoped to college.
const getCoursesForCollege = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
      SELECT DISTINCT Course FROM MasterCourses
      WHERE CollegeName = @CollegeName
      ORDER BY Course
    `);
  return result.recordset.map((r) => r.Course);
};

/**
 * Mirrors VB Display() / DisplayAll():
 *  - collegeName provided -> filtered (+ optional course), same as Display()
 *  - collegeName omitted -> all DeadDebits, same as DisplayAll()
 * VB's DisplayAll() restricted results to Module1.GetCollege() (the logged-in
 * user's privileged colleges). That permission system isn't ported here, so
 * with no collegeName this returns ALL colleges — add a WHERE CollegeName IN
 * (...) clause here once you wire up auth/role scoping.
 */
// const listDeadDebits = async ({ collegeName, course }) => {
//   const pool = await getPool();
//   const request = pool.request();

//   let query = `
//     SELECT DateEntry, CollegeName, IDNo, StudentName, Course, FatherName,
//            Particulars, Debit, TransactionID, Comments
//     FROM DeadDebits
//     WHERE 1 = 1
//   `;

//   if (collegeName) {
//     query += ` AND CollegeName = @CollegeName`;
//     request.input("CollegeName", sql.NVarChar, collegeName);
//   }
//   if (course) {
//     query += ` AND Course = @Course`;
//     request.input("Course", sql.NVarChar, course);
//   }

//   query += ` ORDER BY CollegeName, Course, IDNo, DateEntry`;

//   const result = await request.query(query);
//   return result.recordset;
// };
const listDeadDebits = async ({ collegeName, course, page = 1, pageSize = 20 }) => {
  const pool = await getPool();

  const buildFilters = (request) => {
    let filters = ` WHERE 1 = 1 `;
    if (collegeName) {
      filters += ` AND CollegeName = @CollegeName`;
      request.input("CollegeName", sql.NVarChar, collegeName);
    }
    if (course) {
      filters += ` AND Course = @Course`;
      request.input("Course", sql.NVarChar, course);
    }
    return filters;
  };

  // Total count (same filters, no paging) - needed for "Page X of Y"
  const countRequest = pool.request();
  const countFilters = buildFilters(countRequest);
  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS total
    FROM DeadDebits
    ${countFilters}
  `);
  const totalRecords = countResult.recordset[0].total;

  // Paged rows
  const dataRequest = pool.request();
  const dataFilters = buildFilters(dataRequest);
  dataRequest.input("Offset", sql.Int, (page - 1) * pageSize);
  dataRequest.input("PageSize", sql.Int, pageSize);

  const dataResult = await dataRequest.query(`
    SELECT DateEntry, CollegeName, IDNo, StudentName, Course, FatherName,
           Particulars, Debit, TransactionID, Comments
    FROM DeadDebits
    ${dataFilters}
    ORDER BY CollegeName, Course, IDNo, DateEntry
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
  `);

  return { rows: dataResult.recordset, totalRecords };
};
/**
 * VB's pasted code has no delete handler, but the form has a Delete button +
 * required Comments field. Mirrors the Cancel Receipt pattern: log the row
 * being removed (with the comment) into an audit table, then delete it.
 *
 * ASSUMPTION: DeletedDebits table doesn't exist yet — create it:
 *
 * CREATE TABLE DeletedDebits (
 *   Id INT IDENTITY PRIMARY KEY,
 *   TransactionID INT NOT NULL,
 *   DateEntry DATETIME NULL,
 *   CollegeName NVARCHAR(200) NULL,
 *   IDNo BIGINT NULL,
 *   StudentName NVARCHAR(200) NULL,
 *   Course NVARCHAR(150) NULL,
 *   FatherName NVARCHAR(200) NULL,
 *   Particulars NVARCHAR(500) NULL,
 *   Debit DECIMAL(18,2) NULL,
 *   Comments NVARCHAR(500) NOT NULL,
 *   DeletedDate DATETIME NOT NULL DEFAULT GETDATE(),
 *   DeletedBy NVARCHAR(100) NULL
 * );
 */
// const deleteDeadDebit = async ({ transactionId, comments, userId }) => {
//   const pool = await getPool();
//   const transaction = new sql.Transaction(pool);

//   try {
//     await transaction.begin();

//     const fetchRequest = transaction.request();
//     fetchRequest.input("TransactionID", sql.Int, transactionId);
//     const fetchResult = await fetchRequest.query(`
//       SELECT * FROM DeadDebits WHERE TransactionID = @TransactionID
//     `);

//     if (fetchResult.recordset.length === 0) {
//       await transaction.rollback();
//       return { success: false, message: "No Record Found" };
//     }

//     const row = fetchResult.recordset[0];

//     const insertRequest = transaction.request();
//     insertRequest
//       .input("TransactionID", sql.Int, row.TransactionID)
//       .input("DateEntry", sql.DateTime, row.DateEntry ?? null)
//       .input("CollegeName", sql.NVarChar, row.CollegeName ?? null)
//       .input("IDNo", sql.BigInt, row.IDNo ?? null)
//       .input("StudentName", sql.NVarChar, row.StudentName ?? null)
//       .input("Course", sql.NVarChar, row.Course ?? null)
//       .input("FatherName", sql.NVarChar, row.FatherName ?? null)
//       .input("Particulars", sql.NVarChar, row.Particulars ?? null)
//       .input("Debit", sql.Decimal(18, 2), row.Debit ?? null)
//       .input("Comments", sql.NVarChar, comments)
//       .input("DeletedBy", sql.NVarChar, userId || null);

//     await insertRequest.query(`
//       INSERT INTO DeletedDebits
//         (TransactionID, DateEntry, CollegeName, IDNo, StudentName, Course, FatherName, Particulars, Debit, Comments, DeletedBy)
//       VALUES
//         (@TransactionID, @DateEntry, @CollegeName, @IDNo, @StudentName, @Course, @FatherName, @Particulars, @Debit, @Comments, @DeletedBy)
//     `);

//     const deleteRequest = transaction.request();
//     deleteRequest.input("TransactionID", sql.Int, transactionId);
//     await deleteRequest.query(`
//       DELETE FROM DeadDebits WHERE TransactionID = @TransactionID
//     `);

//     await transaction.commit();
//     return { success: true, message: "Record has been deleted successfully" };
//   } catch (err) {
//     await transaction.rollback();
//     throw err;
//   }
// };


const deleteDeadDebit = async ({ transactionId, comments, userId }) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const fetchRequest = transaction.request();
    fetchRequest.input("TransactionID", sql.Int, transactionId);
    const fetchResult = await fetchRequest.query(`
      SELECT TransactionID
      FROM Ledger
      WHERE TransactionID = @TransactionID
        AND TransactionType = 'Debit'
    `);

    if (fetchResult.recordset.length === 0) {
      await transaction.rollback();
      return { success: false, message: "No Record Found" };
    }

    const deleteRequest = transaction.request();
    deleteRequest.input("TransactionID", sql.Int, transactionId);
    await deleteRequest.query(`
      DELETE FROM Ledger
      WHERE TransactionID = @TransactionID
        AND TransactionType = 'Debit'
    `);

    await transaction.commit();
    return { success: true, message: "Record has been deleted successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  getColleges,
  getCoursesForCollege,
  listDeadDebits,
  deleteDeadDebit,
};