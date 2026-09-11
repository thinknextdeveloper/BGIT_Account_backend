const { sql } = require("../config/db");

/**
 * Semester Repository Layer
 * Interacts with MSSQL database using parameterized queries.
 */
class SemesterRepository {
  /**
   * 1. Get records from MasterCurrentSemester filtered by assigned user colleges & optional dropdown filters
   */
  async displayAll(username, { collegeName, course, batch, semester }) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);
    request.input("course", sql.VarChar(100), course || null);
    request.input("batch", sql.VarChar(100), batch || null);
    request.input("semester", sql.VarChar(100), semester || null);

    const query = `
      SELECT DISTINCT mcs.CollegeName, mcs.Course, mcs.Batch, mcs.Semester
      FROM MasterCurrentSemester mcs
      INNER JOIN UserMaster um ON mcs.CollegeName = um.CollegeName
      WHERE um.UserName = @username
        AND (@collegeName IS NULL OR mcs.CollegeName = @collegeName)
        AND (@course IS NULL OR mcs.Course = @course)
        AND (@batch IS NULL OR mcs.Batch = @batch)
        AND (@semester IS NULL OR mcs.Semester = @semester)
      ORDER BY mcs.CollegeName, mcs.Course, mcs.Batch, mcs.Semester;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * 2. Get assigned colleges from MasterCourse for logged-in user
   */
  async getCollege(username) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);

    const query = `
      SELECT DISTINCT mc.CollegeName 
      FROM MasterCourse mc
      INNER JOIN UserMaster um ON mc.CollegeName = um.CollegeName
      WHERE um.UserName = @username AND mc.CollegeName IS NOT NULL
      ORDER BY mc.CollegeName ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * 3. Get raw assigned college list directly from UserMaster
   */
  async getAssignedCollegeName(username) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);

    const query = `
      SELECT DISTINCT CollegeName 
      FROM UserMaster 
      WHERE UserName = @username 
        AND CollegeName IS NOT NULL 
        AND CollegeName <> '';
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * 4. Check whether a college exists in assigned user's colleges
   */
  async entryAlreadyExist(username, collegeName) {
    if (!username || String(username).toLowerCase() === "admin") {
      return true;
    }
    const cleanCollege = String(collegeName || "").trim();
    if (!cleanCollege) return true;

    try {
      const request = new sql.Request();
      request.input("username", sql.VarChar(100), username);
      request.input("collegeName", sql.VarChar(200), cleanCollege);

      const query = `
        SELECT COUNT(1) AS totalCount 
        FROM UserMaster 
        WHERE UserName = @username 
          AND (
            LTRIM(RTRIM(CollegeName)) = @collegeName
            OR CollegeName LIKE '%' + @collegeName + '%'
            OR @collegeName LIKE '%' + LTRIM(RTRIM(CollegeName)) + '%'
          );
      `;

      const result = await request.query(query);
      const count = result.recordset[0]?.totalCount || 0;
      if (count > 0) return true;

      // Fallback: check all assigned colleges for this username in UserMaster
      const allColReq = new sql.Request();
      allColReq.input("username", sql.VarChar(100), username);
      const userColsRes = await allColReq.query(`SELECT DISTINCT CollegeName FROM UserMaster WHERE UserName = @username;`);
      
      if (!userColsRes.recordset || userColsRes.recordset.length === 0) {
        return true;
      }

      const cleanLowerCol = cleanCollege.toLowerCase();
      return userColsRes.recordset.some((r) => {
        const uCol = String(r.CollegeName || "").trim().toLowerCase();
        return uCol && (uCol === cleanLowerCol || uCol.includes(cleanLowerCol) || cleanLowerCol.includes(uCol));
      });
    } catch (err) {
      console.warn("entryAlreadyExist error:", err.message);
      return true;
    }
  }

  /**
   * 5. Get distinct courses for assigned colleges
   */
  async getCourse(username, collegeName) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);

    const query = `
      SELECT DISTINCT mc.Course 
      FROM MasterCourse mc
      INNER JOIN UserMaster um ON mc.CollegeName = um.CollegeName
      WHERE um.UserName = @username 
        AND (@collegeName IS NULL OR mc.CollegeName = @collegeName)
        AND mc.Course IS NOT NULL
      ORDER BY mc.Course ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * 6. Get distinct batches for assigned colleges
   */
  async getBatch(username, collegeName, course) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);
    request.input("course", sql.VarChar(100), course || null);

    const query = `
      SELECT DISTINCT mc.Batch 
      FROM MasterCourse mc
      INNER JOIN UserMaster um ON mc.CollegeName = um.CollegeName
      WHERE um.UserName = @username 
        AND (@collegeName IS NULL OR mc.CollegeName = @collegeName)
        AND (@course IS NULL OR mc.Course = @course)
        AND mc.Batch IS NOT NULL
      ORDER BY mc.Batch ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * 7. Get distinct semesters ordered by SemesterID for assigned colleges
   */
  async getSemester(username, collegeName, course, batch) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);
    request.input("course", sql.VarChar(100), course || null);
    request.input("batch", sql.VarChar(100), batch || null);

    const query = `
      SELECT DISTINCT mc.Semester, mc.SemesterID 
      FROM MasterCourse mc
      INNER JOIN UserMaster um ON mc.CollegeName = um.CollegeName
      WHERE um.UserName = @username 
        AND (@collegeName IS NULL OR mc.CollegeName = @collegeName)
        AND (@course IS NULL OR mc.Course = @course)
        AND (@batch IS NULL OR mc.Batch = @batch)
        AND mc.Semester IS NOT NULL
      ORDER BY mc.SemesterID ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * 8. Insert new record into MasterCurrentSemester table
   */
  async createSemester(collegeName, course, batch, semester) {
    const request = new sql.Request();
    request.input("collegeName", sql.VarChar(100), collegeName);
    request.input("course", sql.VarChar(100), course);
    request.input("batch", sql.VarChar(100), batch);
    request.input("semester", sql.VarChar(100), semester);

    // Check if record already exists in MasterCurrentSemester
    const checkQuery = `
      SELECT COUNT(1) AS existingCount
      FROM MasterCurrentSemester
      WHERE CollegeName = @collegeName 
        AND Course = @course 
        AND Batch = @batch 
        AND Semester = @semester;
    `;
    const checkResult = await request.query(checkQuery);
    if (checkResult.recordset[0]?.existingCount > 0) {
      throw new Error("This record already exists in MasterCurrentSemester.");
    }

    const insertQuery = `
      INSERT INTO MasterCurrentSemester (CollegeName, Course, Batch, Semester)
      VALUES (@collegeName, @course, @batch, @semester);
    `;
    await request.query(insertQuery);
    return true;
  }
}

module.exports = new SemesterRepository();
