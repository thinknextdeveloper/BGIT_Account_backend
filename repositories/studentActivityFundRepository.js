const { sql } = require("../config/db");

/**
 * Student Activity Fund Repository Layer
 * Interacts with MSSQL MasterStudentActivityFund table using parameterized queries.
 */
class StudentActivityFundRepository {
  /**
   * Fetch MasterStudentActivityFund records for logged-in user's assigned colleges
   */
  async getStudentActivityFunds(username, filters = {}) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("session", sql.VarChar(50), filters.session || null);
    request.input("collegeName", sql.VarChar(100), filters.collegeName || null);
    request.input("course", sql.VarChar(100), filters.course || null);
    request.input("batch", sql.VarChar(50), filters.batch || null);
    request.input("semester", sql.VarChar(50), filters.semester || null);

    const query = `
      SELECT 
        msaf.Session,
        msaf.CollegeName,
        msaf.Course,
        msaf.Batch,
        msaf.Semester,
        mc.SemesterID,
        msaf.Scheme,
        msaf.FeeCategory AS Category,
        ISNULL(msaf.StudentFund, 0) AS StudentFund,
        ISNULL(msaf.AnnualCultureFund, 0) AS AnnualCultureFund,
        ISNULL(msaf.AudioVisual, 0) AS AudioVisual,
        ISNULL(msaf.CommonRoom, 0) AS CommonRoom,
        ISNULL(msaf.LibraryFund, 0) AS LibraryFund,
        ISNULL(msaf.MagazineCharge, 0) AS MagazineCharge,
        ISNULL(msaf.NCCNSS, 0) AS NCCNSS,
        ISNULL(msaf.CycleScooterCharge, 0) AS CycleScooterCharge,
        ISNULL(msaf.MedicalFund, 0) AS MedicalFund,
        ISNULL(msaf.DrawingBoard, 0) AS DrawingBoard,
        ISNULL(msaf.GeneralMaintenance, 0) AS GeneralMaintenance,
        ISNULL(msaf.Recreation, 0) AS Recreation,
        ISNULL(msaf.StudentChapter, 0) AS StudentChapter,
        ISNULL(msaf.StationeryCharge, 0) AS StationeryCharge,
        ISNULL(msaf.ValedictoryFund, 0) AS ValedictoryFund,
        ISNULL(msaf.IdentityCard, 0) AS IdentityCard,
        ISNULL(msaf.RefundableSecurity, 0) AS RefundableSecurity
      FROM MasterStudentActivityFund msaf
      INNER JOIN UserMaster um ON msaf.CollegeName = um.CollegeName
      LEFT JOIN MasterCourse mc ON msaf.CollegeName = mc.CollegeName 
                               AND msaf.Course = mc.Course 
                               AND CAST(msaf.Batch AS VARCHAR(50)) = CAST(mc.Batch AS VARCHAR(50))
                               AND msaf.Semester = mc.Semester
      WHERE CAST(um.UserName AS VARCHAR(100)) = @username
        AND (@session IS NULL OR @session = '' OR msaf.Session = @session)
        AND (@collegeName IS NULL OR @collegeName = '' OR msaf.CollegeName = @collegeName)
        AND (@course IS NULL OR @course = '' OR msaf.Course = @course)
        AND (@batch IS NULL OR @batch = '' OR CAST(msaf.Batch AS VARCHAR(50)) = @batch)
        AND (@semester IS NULL OR @semester = '' OR msaf.Semester = @semester)
      ORDER BY msaf.CollegeName ASC, msaf.Course ASC, msaf.Batch ASC, msaf.Semester ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get distinct Schemes for assigned colleges
   */
  async getSchemes(username) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);

    const query = `
      SELECT DISTINCT ms.Scheme
      FROM MasterScheme ms
      INNER JOIN UserMaster um ON ms.CollegeName = um.CollegeName
      WHERE CAST(um.UserName AS VARCHAR(100)) = @username
      ORDER BY ms.Scheme ASC;
    `;
    const result = await request.query(query);
    return result.recordset.map((r) => r.Scheme);
  }

  /**
   * Get distinct Categories for assigned colleges
   */
  async getCategories(username) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);

    const query = `
      SELECT DISTINCT mc.Category
      FROM MasterCategory mc
      INNER JOIN UserMaster um ON mc.CollegeName = um.CollegeName
      WHERE CAST(um.UserName AS VARCHAR(100)) = @username
      ORDER BY mc.Category ASC;
    `;
    const result = await request.query(query);
    return result.recordset.map((r) => r.Category);
  }

  /**
   * Insert new MasterStudentActivityFund record with duplicate check matching VB.NET btnSave_Click
   */
  async createStudentActivityFund(data) {
    const request = new sql.Request();
    request.input("session", sql.VarChar(50), data.session);
    request.input("collegeName", sql.VarChar(100), data.collegeName);
    request.input("course", sql.VarChar(100), data.course);
    request.input("batch", sql.Int, parseInt(data.batch, 10));
    request.input("semester", sql.VarChar(50), data.semester);
    request.input("scheme", sql.VarChar(100), data.scheme);
    request.input("category", sql.VarChar(100), data.category);

    // Duplicate Check Query matching VB.NET
    const checkQuery = `
      SELECT COUNT(1) AS existingCount
      FROM MasterStudentActivityFund
      WHERE Session = @session
        AND CollegeName = @collegeName
        AND Course = @course
        AND Batch = @batch
        AND Semester = @semester
        AND Scheme = @scheme
        AND FeeCategory = @category;
    `;
    const checkResult = await request.query(checkQuery);
    if (checkResult.recordset[0]?.existingCount > 0) {
      throw new Error("Sorry this entry is already exist");
    }

    // Fetch SemesterID from MasterCourse if available
    let semesterId = null;
    try {
      const semReq = new sql.Request();
      semReq.input("semester", sql.VarChar(50), data.semester);
      const semRes = await semReq.query("SELECT DISTINCT SemesterID FROM MasterCourse WHERE Semester = @semester");
      semesterId = semRes.recordset[0]?.SemesterID || null;
    } catch (e) {
      console.warn("SemesterID fetch error:", e);
    }

    const insReq = new sql.Request();
    insReq.input("Session", sql.VarChar(50), data.session);
    insReq.input("CollegeName", sql.VarChar(100), data.collegeName);
    insReq.input("Course", sql.VarChar(100), data.course);
    insReq.input("Batch", sql.Int, parseInt(data.batch, 10));
    insReq.input("Semester", sql.VarChar(50), data.semester);
    insReq.input("SemesterID", sql.Int, semesterId);
    insReq.input("Scheme", sql.VarChar(100), data.scheme);
    insReq.input("FeeCategory", sql.VarChar(100), data.category);

    insReq.input("StudentFund", sql.Int, data.studentFund ?? null);
    insReq.input("AnnualCultureFund", sql.Int, data.annualCultureFund ?? null);
    insReq.input("AudioVisual", sql.Int, data.audioVisual ?? null);
    insReq.input("CommonRoom", sql.Int, data.commonRoom ?? null);
    insReq.input("LibraryFund", sql.Int, data.libraryFund ?? null);
    insReq.input("MagazineCharge", sql.Int, data.magazineCharge ?? null);
    insReq.input("NCCNSS", sql.Int, data.nccnss ?? null);
    insReq.input("CycleScooterCharge", sql.Int, data.cycleScooterCharge ?? null);
    insReq.input("MedicalFund", sql.Int, data.medicalFund ?? null);
    insReq.input("DrawingBoard", sql.Int, data.drawingBoard ?? null);
    insReq.input("GeneralMaintenance", sql.Int, data.generalMaintenance ?? null);
    insReq.input("Recreation", sql.Int, data.recreation ?? null);
    insReq.input("StudentChapter", sql.Int, data.studentChapter ?? null);
    insReq.input("StationeryCharge", sql.Int, data.stationeryCharge ?? null);
    insReq.input("ValedictoryFund", sql.Int, data.valedictoryFund ?? null);
    insReq.input("IdentityCard", sql.Int, data.identityCard ?? null);
    insReq.input("RefundableSecurity", sql.Int, data.refundableSecurity ?? null);
    insReq.input("Total", sql.Int, data.total ?? null);

    const insertQuery = `
      INSERT INTO MasterStudentActivityFund (
        Session, CollegeName, Course, Batch, Semester, SemesterID, Scheme, FeeCategory,
        StudentFund, AnnualCultureFund, AudioVisual, CommonRoom, LibraryFund, MagazineCharge,
        NCCNSS, CycleScooterCharge, MedicalFund, DrawingBoard, GeneralMaintenance, Recreation,
        StudentChapter, StationeryCharge, ValedictoryFund, IdentityCard, RefundableSecurity, Total
      ) VALUES (
        @Session, @CollegeName, @Course, @Batch, @Semester, @SemesterID, @Scheme, @FeeCategory,
        @StudentFund, @AnnualCultureFund, @AudioVisual, @CommonRoom, @LibraryFund, @MagazineCharge,
        @NCCNSS, @CycleScooterCharge, @MedicalFund, @DrawingBoard, @GeneralMaintenance, @Recreation,
        @StudentChapter, @StationeryCharge, @ValedictoryFund, @IdentityCard, @RefundableSecurity, @Total
      );
    `;

    await insReq.query(insertQuery);
    return true;
  }
}

module.exports = new StudentActivityFundRepository();
