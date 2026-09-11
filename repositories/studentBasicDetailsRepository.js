const { sql } = require("../config/db");
const semesterRepository = require("./semesterRepository");

/**
 * StudentBasicDetails Repository Layer
 * Interacts with MSSQL Admissions table using parameterized paginated queries.
 */
class StudentBasicDetailsRepository {
  /**
   * Fetch Admissions basic details for logged-in user's assigned colleges with pagination and search
   */
  async getStudentBasicDetails(username, collegeName = null, page = 1, limit = 100, searchTerm = null) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 100);
    const offset = (pageNum - 1) * limitNum;
    const searchVal = searchTerm && String(searchTerm).trim() !== "" ? String(searchTerm).trim() : null;

    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);
    request.input("search", sql.VarChar(200), searchVal);
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limitNum);

    const countQuery = `
      SELECT COUNT(*) AS totalRecords
      FROM Admissions a
      WHERE ((@collegeName IS NOT NULL AND @collegeName <> '' AND a.CollegeName = @collegeName)
         OR ((@collegeName IS NULL OR @collegeName = '') AND a.CollegeName IN (
              SELECT DISTINCT CollegeName 
              FROM UserMaster 
              WHERE UserName = @username OR CAST(UserName AS VARCHAR(100)) = @username
            )))
        AND (@search IS NULL OR @search = '' OR (
            CAST(a.IDNo AS VARCHAR(100)) LIKE '%' + @search + '%'
            OR a.StudentName LIKE '%' + @search + '%'
            OR a.ClassRollNo LIKE '%' + @search + '%'
            OR a.FatherName LIKE '%' + @search + '%'
            OR a.Course LIKE '%' + @search + '%'
            OR a.CollegeName LIKE '%' + @search + '%'
            OR a.Category LIKE '%' + @search + '%'
            OR a.Scheme LIKE '%' + @search + '%'
            OR a.EmailID LIKE '%' + @search + '%'
            OR a.StudentMobileNo LIKE '%' + @search + '%'
        ));
    `;

    const dataQuery = `
      SELECT 
        a.CollegeName,
        a.Course,
        a.Batch,
        a.Class,
        a.LateralEntry,
        a.AdmissionDate,
        a.IDNo,
        a.ClassRollNo,
        a.StudentName,
        a.FatherName,
        a.MotherName,
        a.Sex,
        a.DOB,
        a.FatherOccupation,
        a.CorrespondanceAddress,
        a.PermanentAddress,
        a.EmailID,
        a.PhoneNo,
        a.StudentMobileNo,
        a.FatherMobileNo,
        a.Facility,
        a.StudentType,
        a.Category,
        a.Scheme,
        a.Snap
      FROM Admissions a
      WHERE ((@collegeName IS NOT NULL AND @collegeName <> '' AND a.CollegeName = @collegeName)
         OR ((@collegeName IS NULL OR @collegeName = '') AND a.CollegeName IN (
              SELECT DISTINCT CollegeName 
              FROM UserMaster 
              WHERE UserName = @username OR CAST(UserName AS VARCHAR(100)) = @username
            )))
        AND (@search IS NULL OR @search = '' OR (
            CAST(a.IDNo AS VARCHAR(100)) LIKE '%' + @search + '%'
            OR a.StudentName LIKE '%' + @search + '%'
            OR a.ClassRollNo LIKE '%' + @search + '%'
            OR a.FatherName LIKE '%' + @search + '%'
            OR a.Course LIKE '%' + @search + '%'
            OR a.CollegeName LIKE '%' + @search + '%'
            OR a.Category LIKE '%' + @search + '%'
            OR a.Scheme LIKE '%' + @search + '%'
            OR a.EmailID LIKE '%' + @search + '%'
            OR a.StudentMobileNo LIKE '%' + @search + '%'
        ))
      ORDER BY a.IDNo ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const countResult = await request.query(countQuery);
    const totalRecords = countResult.recordset[0]?.totalRecords || 0;

    const dataResult = await request.query(dataQuery);

    return {
      totalRecords,
      records: dataResult.recordset || [],
    };
  }

  /**
   * Reuse existing GetCollege method from semesterRepository
   */
  async getCollege(username) {
    return await semesterRepository.getCollege(username);
  }
}

module.exports = new StudentBasicDetailsRepository();
