const { sql, getPool } = require("../config/db");

class CancelRestoreRepository {
  /**
   * Get student detail matching displayStudentDetail() VB query
   */
  async getStudentByCancelRestoreID(idNo) {
    const idStr = String(idNo).trim();
    const idNum = isNaN(Number(idStr)) ? 0 : Number(idStr);

    console.log("[CancelRestore Repository] Querying Admissions for IDNo:", idStr);

    const pool = await getPool();
    const request = pool.request();
    request.input("IDNoStr", sql.VarChar(100), idStr);
    request.input("IDNoNum", sql.BigInt, idNum);

    const query = `
      SELECT 
        CollegeName, Course, Class, Batch, ClassRollNo, LateralEntry, AdmissionDate, IDNo, Section, GroupName, 
        StudentName, FatherName, MotherName, Sex, DOB, FatherOccupation, MotherOccupation, FatherDesignation, 
        FatherEmailID, CorrespondanceAddress, PermanentAddress, EmailID, PhoneNo, StudentMobileNo, FatherMobileNo, 
        MotherMobileNo, Facility, BusRoute, RouteID, Stopage, StopageID, HostelName, RoomType, HostelCharges, 
        BusFee, StudentType, Concession, ConcessionDetails, ConcessionPerc, ConcessionTotalAmount, BloodGroup, 
        Category, Locality, Medium, Quota, FeeWaiverScheme, FirstPreference, SecondPreference, ThirdPreference, 
        FourthPreference, Scheme, InstitutionLastAttended, University, State, Religion, SeatConfirmed, City, 
        BoardRegistrationNo, ConcessionReferenceLetterNo, Village, VPO, PO, Tehsil, District, GuardianAddress, 
        GuardianContactNo, Nationality, PreviousMedicalIllness, NSS, Sports, OtherAchievements, UniRollNo, 
        EnquiryDate, EnquiryNo, RegistrationNo, RegistrationDate, OtherEntranceTest, UserID, Snap, CardIssued, 
        CardIssuedDate, ValidUpTo, LastExam, Board, LastExamPerc, Newspaper, ThirdPerson, CableTV, Student, 
        StaffMember, FlexBoard, Pamphlet, Comments, ThirdPersonName, ThirdPersonDesignation, ThirdPersonAddress, 
        ThirdPersonContactNo, CableTVChannel, ReferenceStudentClass, StaffMemberName, StaffMemberDesignation, 
        NewspaperName, CommentsDetail, Locked, SmartCardIssued, SmartCardIssuedDate, EntranceTest1, 
        EntranceTest1RollNo, EntranceTest1Rank, EntranceTest2, EntranceTest2RollNo, EntranceTest2Rank 
      FROM Admissions 
      WHERE LTRIM(RTRIM(CAST(IDNo AS VARCHAR(100)))) = @IDNoStr
         OR IDNo = @IDNoNum
         OR IDNo = TRY_CAST(@IDNoStr AS BIGINT)
         OR IDNo = TRY_CAST(@IDNoStr AS NUMERIC(18,0));
    `;

    const result = await request.query(query);
    console.log("[CancelRestore Repository] Admissions student found count:", result.recordset?.length || 0);
    return result.recordset || [];
  }

  /**
   * DisplayAllCancellation() SQL logic matching VB.NET GetAssignedCollegeName1() & GetCollege()
   */
  async displayAllCancellation(username) {
    console.log("------------------------------------------");
    console.log("📌 Logged-in Username (Repository):", username);
    console.log("------------------------------------------");
    const pool = await getPool();

    // Step 1: Function GetAssignedCollegeName1()
    let assignedColleges = [];
    try {
      const userReq = pool.request();
      userReq.input("username", sql.VarChar(100), username || "");
      const userRes = await userReq.query(`
        SELECT DISTINCT CollegeName 
        FROM UserMaster 
        WHERE UserName = @username AND CollegeName IS NOT NULL AND CollegeName <> '';
      `);
      assignedColleges = userRes.recordset?.map((r) => r.CollegeName).filter(Boolean) || [];
      console.log("📌 Assigned Colleges (UserMaster):", assignedColleges);
    } catch (e) {
      console.warn("GetAssignedCollegeName1 error:", e.message);
    }

    // Step 2: Function GetCollege()
    let matchedColleges = assignedColleges;
    if (assignedColleges.length > 0) {
      try {
        const courseReq = pool.request();
        const inClause = assignedColleges.map((_, i) => `@c${i}`).join(",");
        assignedColleges.forEach((c, i) => courseReq.input(`c${i}`, sql.VarChar(200), c));

        const courseRes = await courseReq.query(`
          SELECT DISTINCT CollegeName 
          FROM MasterCourse 
          WHERE CollegeName IN (${inClause})
          ORDER BY CollegeName;
        `);
        const fetched = courseRes.recordset?.map((r) => r.CollegeName).filter(Boolean) || [];
        if (fetched.length > 0) {
          matchedColleges = fetched;
        }
        console.log("📌 Matched Colleges (GetCollege):", matchedColleges);
      } catch (e) {
        console.warn("GetCollege error:", e.message);
      }
    }

    // Step 3: Sub DisplayAllCancellation()
    const mainReq = pool.request();
    let selectQuery = `
      SELECT 
        CancellationDate, CancelStatus, Reason, ShiftedFrom, ShiftedTo, CollegeName, Course, Class, Batch, 
        Section, ClassRollNo, LateralEntry, AdmissionDate, IDNo, StudentName, Sex, FatherName, MotherName, DOB, 
        FatherOccupation, MotherOccupation, FatherDesignation, FatherEmailID, CorrespondanceAddress, 
        PermanentAddress, EmailID, PhoneNo, StudentMobileNo, FatherMobileNo, MotherMobileNo, Facility, BusRoute, 
        RouteID, Stopage, StopageID, HostelName, RoomType, HostelCharges, BusFee, StudentType, Concession, 
        ConcessionDetails, ConcessionPerc, ConcessionTotalAmount, BloodGroup, Category, Locality, Medium, 
        Quota, FeeWaiverScheme, FirstPreference, SecondPreference, ThirdPreference, FourthPreference, Scheme, 
        InstitutionLastAttended, University, State, Religion, SeatConfirmed, City, BoardRegistrationNo, 
        ConcessionReferenceLetterNo, Village, VPO, PO, Tehsil, District, GuardianAddress, GuardianContactNo, 
        Nationality, PreviousMedicalIllness, OtherEntranceTest, NSS, Sports, OtherAchievements, GroupName, 
        UniRollNo, UserID, EnquiryNo, EnquiryDate, RegistrationNo, RegistrationDate, Snap, CardIssued, 
        CardIssuedDate, ValidUpTo, LastExam, Board, LastExamPerc, Newspaper, ThirdPerson, CableTV, Student, 
        StaffMember, FlexBoard, Pamphlet, Comments, ThirdPersonName, ThirdPersonDesignation, ThirdPersonAddress, 
        ThirdPersonContactNo, CableTVChannel, ReferenceStudentClass, StaffMemberName, StaffMemberDesignation, 
        NewspaperName, CommentsDetail, Locked, SmartCardIssued, SmartCardIssuedDate, EntranceTest1, 
        EntranceTest1RollNo, EntranceTest1Rank, EntranceTest2, EntranceTest2RollNo, EntranceTest2Rank 
      FROM CancelledAdmission
    `;

    if (matchedColleges.length > 0) {
      const mainInClause = matchedColleges.map((_, i) => `@m${i}`).join(",");
      matchedColleges.forEach((c, i) => mainReq.input(`m${i}`, sql.VarChar(200), c));
      selectQuery += ` WHERE CollegeName IN (${mainInClause})`;
    }

    selectQuery += ` ORDER BY CancellationDate DESC;`;

    try {
      const mainRes = await mainReq.query(selectQuery);
      console.log("[CancelRestore Repository] CancelledAdmission count:", mainRes.recordset?.length || 0);

      if (!mainRes.recordset || mainRes.recordset.length === 0) {
        // Fallback: Return all rows from CancelledAdmission if specific college filter returns empty
        const fbRes = await pool.request().query(`
          SELECT 
            CancellationDate, CancelStatus, Reason, ShiftedFrom, ShiftedTo, CollegeName, Course, Class, Batch, 
            Section, ClassRollNo, LateralEntry, AdmissionDate, IDNo, StudentName, Sex, FatherName, MotherName, DOB, 
            FatherOccupation, MotherOccupation, FatherDesignation, FatherEmailID, CorrespondanceAddress, 
            PermanentAddress, EmailID, PhoneNo, StudentMobileNo, FatherMobileNo, MotherMobileNo, Facility, BusRoute, 
            RouteID, Stopage, StopageID, HostelName, RoomType, HostelCharges, BusFee, StudentType, Concession, 
            ConcessionDetails, ConcessionPerc, ConcessionTotalAmount, BloodGroup, Category, Locality, Medium, 
            Quota, FeeWaiverScheme, FirstPreference, SecondPreference, ThirdPreference, FourthPreference, Scheme, 
            InstitutionLastAttended, University, State, Religion, SeatConfirmed, City, BoardRegistrationNo, 
            ConcessionReferenceLetterNo, Village, VPO, PO, Tehsil, District, GuardianAddress, GuardianContactNo, 
            Nationality, PreviousMedicalIllness, OtherEntranceTest, NSS, Sports, OtherAchievements, GroupName, 
            UniRollNo, UserID, EnquiryNo, EnquiryDate, RegistrationNo, RegistrationDate, Snap, CardIssued, 
            CardIssuedDate, ValidUpTo, LastExam, Board, LastExamPerc, Newspaper, ThirdPerson, CableTV, Student, 
            StaffMember, FlexBoard, Pamphlet, Comments, ThirdPersonName, ThirdPersonDesignation, ThirdPersonAddress, 
            ThirdPersonContactNo, CableTVChannel, ReferenceStudentClass, StaffMemberName, StaffMemberDesignation, 
            NewspaperName, CommentsDetail, Locked, SmartCardIssued, SmartCardIssuedDate, EntranceTest1, 
            EntranceTest1RollNo, EntranceTest1Rank, EntranceTest2, EntranceTest2RollNo, EntranceTest2Rank 
          FROM CancelledAdmission
          ORDER BY CancellationDate DESC;
        `);
        console.log("[CancelRestore Repository] Fallback CancelledAdmission count:", fbRes.recordset?.length || 0);
        return fbRes.recordset || [];
      }

      return mainRes.recordset || [];
    } catch (err) {
      console.warn("CancelledAdmission query error:", err.message);
      return [];
    }
  }

  /**
   * showCourse() SQL query: select Distinct Course from MasterCourse where CollegeName = @collegeName
   */
  async getCoursesByCollege(collegeName) {
    const cleanCollege = String(collegeName || "").trim();
    console.log("[CancelRestore Repository] getCoursesByCollege for college:", cleanCollege);

    const pool = await getPool();
    const request = pool.request();
    request.input("CollegeName", sql.VarChar(200), cleanCollege);

    const query = `
      SELECT DISTINCT Course 
      FROM MasterCourse 
      WHERE LTRIM(RTRIM(CollegeName)) = @CollegeName
         OR CollegeName = @CollegeName
      ORDER BY Course;
    `;
    let result = await request.query(query);
    let courses = result.recordset?.map((r) => r.Course).filter(Boolean) || [];

    if (courses.length === 0 && cleanCollege.length > 5) {
      // Fallback 1: Partial LIKE search if exact match returned 0 rows
      const likeReq = pool.request();
      likeReq.input("CollegeLike", sql.VarChar(200), `%${cleanCollege.substring(0, 10)}%`);
      const likeQuery = `
        SELECT DISTINCT Course 
        FROM MasterCourse 
        WHERE CollegeName LIKE @CollegeLike AND Course IS NOT NULL AND Course <> ''
        ORDER BY Course;
      `;
      const likeRes = await likeReq.query(likeQuery);
      courses = likeRes.recordset?.map((r) => r.Course).filter(Boolean) || [];
    }

    if (courses.length === 0) {
      // Fallback 2: All distinct courses from MasterCourse
      const allRes = await pool.request().query(`
        SELECT DISTINCT Course 
        FROM MasterCourse 
        WHERE Course IS NOT NULL AND Course <> ''
        ORDER BY Course;
      `);
      courses = allRes.recordset?.map((r) => r.Course).filter(Boolean) || [];
    }

    console.log("[CancelRestore Repository] getCoursesByCollege returned courses count:", courses.length);
    return courses;
  }

  /**
   * btnAddCancAdm_Click SQL logic: insert into CancelledAdmission & delete from Admissions
   */
  async addCancelledAdmission(studentRow, cancelStatus, reason, shiftedFrom, shiftedTo, username) {
    try {
      const pool = await getPool();
      const request = pool.request();

      const today = new Date();
      const cancellationDateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

      // Map parameters from studentRow (Admissions record) + user inputs
      request.input("CancellationDate", sql.VarChar(50), cancellationDateStr);
      request.input("CancelStatus", sql.VarChar(100), cancelStatus || null);
      request.input("Reason", sql.VarChar(500), reason || null);
      request.input("ShiftedFrom", sql.VarChar(200), shiftedFrom || null);
      request.input("ShiftedTo", sql.VarChar(200), shiftedTo || null);

      // List of student attributes to copy from Admissions row
      const fieldMapping = [
        "CollegeName", "Course", "Class", "Batch", "ClassRollNo", "LateralEntry", "AdmissionDate", "IDNo", "Section", "GroupName",
        "StudentName", "FatherName", "MotherName", "Sex", "DOB", "FatherOccupation", "MotherOccupation", "FatherDesignation", "FatherEmailID", "CorrespondanceAddress",
        "PermanentAddress", "EmailID", "PhoneNo", "StudentMobileNo", "FatherMobileNo", "MotherMobileNo", "Facility", "BusRoute", "RouteID", "Stopage",
        "StopageID", "HostelName", "RoomType", "HostelCharges", "BusFee", "StudentType", "Concession", "ConcessionDetails", "ConcessionPerc", "ConcessionTotalAmount",
        "BloodGroup", "Category", "Locality", "Medium", "Quota", "FeeWaiverScheme", "FirstPreference", "SecondPreference", "ThirdPreference", "FourthPreference",
        "Scheme", "InstitutionLastAttended", "University", "State", "Religion", "SeatConfirmed", "City", "BoardRegistrationNo", "ConcessionReferenceLetterNo", "Village",
        "VPO", "PO", "Tehsil", "District", "GuardianAddress", "GuardianContactNo", "Nationality", "PreviousMedicalIllness", "NSS", "Sports",
        "OtherAchievements", "UniRollNo", "EnquiryNo", "EnquiryDate", "RegistrationNo", "RegistrationDate", "CardIssued", "CardIssuedDate", "ValidUpTo",
        "LastExam", "Board", "LastExamPerc", "Newspaper", "ThirdPerson", "CableTV", "Student", "StaffMember", "FlexBoard", "Pamphlet", "Comments",
        "ThirdPersonName", "ThirdPersonDesignation", "ThirdPersonAddress", "ThirdPersonContactNo", "CableTVChannel", "ReferenceStudentClass", "StaffMemberName",
        "StaffMemberDesignation", "NewspaperName", "CommentsDetail", "Locked", "SmartCardIssued", "SmartCardIssuedDate", "EntranceTest1", "EntranceTest1RollNo",
        "EntranceTest1Rank", "EntranceTest2", "EntranceTest2RollNo", "EntranceTest2Rank"
      ];

      fieldMapping.forEach((field) => {
        let val = studentRow[field];
        if (val === undefined || val === null) {
          val = null;
        } else if (val instanceof Date) {
          val = `${String(val.getMonth() + 1).padStart(2, '0')}/${String(val.getDate()).padStart(2, '0')}/${val.getFullYear()}`;
        }
        request.input(field, val);
      });

      request.input("UserID", sql.VarChar(100), username || studentRow["UserID"] || null);

      const cols = [
        "CancellationDate", "CancelStatus", "Reason", "ShiftedFrom", "ShiftedTo", "CollegeName", "Course", "Class", "Batch", "ClassRollNo", "LateralEntry", "AdmissionDate", "IDNo", "Section", "GroupName", "StudentName", "FatherName", "MotherName", "Sex", "DOB", "FatherOccupation", "MotherOccupation", "FatherDesignation", "FatherEmailID", "CorrespondanceAddress", "PermanentAddress", "EmailID", "PhoneNo", "StudentMobileNo", "FatherMobileNo", "MotherMobileNo", "Facility", "BusRoute", "RouteID", "Stopage", "StopageID", "HostelName", "RoomType", "HostelCharges", "BusFee", "StudentType", "Concession", "ConcessionDetails", "ConcessionPerc", "ConcessionTotalAmount", "BloodGroup", "Category", "Locality", "Medium", "Quota", "FeeWaiverScheme", "FirstPreference", "SecondPreference", "ThirdPreference", "FourthPreference", "Scheme", "InstitutionLastAttended", "University", "State", "Religion", "SeatConfirmed", "City", "BoardRegistrationNo", "ConcessionReferenceLetterNo", "Village", "VPO", "PO", "Tehsil", "District" , "GuardianAddress", "GuardianContactNo", "Nationality", "PreviousMedicalIllness", "NSS", "Sports", "OtherAchievements", "UniRollNo", "EnquiryDate", "EnquiryNo", "RegistrationNo", "RegistrationDate", "UserID", "CardIssued", "CardIssuedDate", "ValidUpTo", "LastExam", "Board", "LastExamPerc", "Newspaper", "ThirdPerson", "CableTV", "Student", "StaffMember", "FlexBoard", "Pamphlet", "Comments", "ThirdPersonName", "ThirdPersonDesignation", "ThirdPersonAddress", "ThirdPersonContactNo", "CableTVChannel", "ReferenceStudentClass", "StaffMemberName",  "StaffMemberDesignation", "NewspaperName", "CommentsDetail", "Locked", "SmartCardIssued", "SmartCardIssuedDate", "EntranceTest1", "EntranceTest1RollNo", "EntranceTest1Rank", "EntranceTest2", "EntranceTest2RollNo", "EntranceTest2Rank"
      ];

      const insertQuery = `
        INSERT INTO CancelledAdmission (
          ${cols.join(", ")}
        ) VALUES (
          ${cols.map(c => `@${c}`).join(", ")}
        );
      `;

      const result = await request.query(insertQuery);
      console.log("[CancelRestore Repository] Inserted into CancelledAdmission rowsAffected:", result.rowsAffected);

      // delcmd = New SqlCommand("delete from Admissions where IDNo=" & txtIDNo.Text & "", con)
      const delReq = pool.request();
      delReq.input("IDNo", sql.VarChar(100), String(studentRow.IDNo));
      const delRes = await delReq.query("DELETE FROM Admissions WHERE IDNo = @IDNo;");
      console.log(`[CancelRestore Repository] Student IDNo ${studentRow.IDNo} deleted from Admissions table. rowsAffected:`, delRes.rowsAffected);

      return true;
    } catch (err) {
      console.error("[CancelRestore Repository] addCancelledAdmission SQL error:", err.message || err);
      throw err;
    }
  }

  /**
   * btnAddRegistration_Click SQL logic: restore student from CancelledAdmission to Admissions
   */
  async restoreAdmission(idNo, username) {
    try {
      const pool = await getPool();

      const cleanId = String(idNo || "").trim();

      // 1. Fetch student row from CancelledAdmission
      const getReq = pool.request();
      getReq.input("IDNo", sql.VarChar(100), cleanId);
      const getRes = await getReq.query(`
        SELECT * FROM CancelledAdmission 
        WHERE IDNo = @IDNo OR CAST(IDNo AS VARCHAR(100)) = @IDNo;
      `);
      if (!getRes.recordset || getRes.recordset.length === 0) {
        throw new Error("No record found in CancelledAdmission");
      }
      const studentRow = getRes.recordset[0];

      // 2. Check if record already exists in Admissions
      const checkReq = pool.request();
      checkReq.input("IDNo", sql.VarChar(100), cleanId);
      const checkRes = await checkReq.query(`
        SELECT IDNo FROM Admissions 
        WHERE IDNo = @IDNo OR CAST(IDNo AS VARCHAR(100)) = @IDNo;
      `);
      if (checkRes.recordset && checkRes.recordset.length > 0) {
        throw new Error("Record already exists in Admissions");
      }

      // 3. Insert into Admissions table
      const request = pool.request();
      const fieldMapping = [
        "CollegeName", "Course", "Class", "Batch", "ClassRollNo", "LateralEntry", "AdmissionDate", "IDNo", "Section", "GroupName",
        "StudentName", "FatherName", "MotherName", "Sex", "DOB", "FatherOccupation", "MotherOccupation", "FatherDesignation", "FatherEmailID", "CorrespondanceAddress",
        "PermanentAddress", "EmailID", "PhoneNo", "StudentMobileNo", "FatherMobileNo", "MotherMobileNo", "Facility", "BusRoute", "RouteID", "Stopage",
        "StopageID", "HostelName", "RoomType", "HostelCharges", "BusFee", "StudentType", "Concession", "ConcessionDetails", "ConcessionPerc", "ConcessionTotalAmount",
        "BloodGroup", "Category", "Locality", "Medium", "Quota", "FeeWaiverScheme", "FirstPreference", "SecondPreference", "ThirdPreference", "FourthPreference",
        "Scheme", "InstitutionLastAttended", "University", "State", "Religion", "SeatConfirmed", "City", "BoardRegistrationNo", "ConcessionReferenceLetterNo", "Village",
        "VPO", "PO", "Tehsil", "District", "GuardianAddress", "GuardianContactNo", "Nationality", "PreviousMedicalIllness", "NSS", "Sports",
        "OtherAchievements", "UniRollNo", "EnquiryNo", "EnquiryDate", "RegistrationNo", "RegistrationDate", "CardIssued", "CardIssuedDate", "ValidUpTo",
        "LastExam", "Board", "LastExamPerc", "Newspaper", "ThirdPerson", "CableTV", "Student", "StaffMember", "FlexBoard", "Pamphlet", "Comments",
        "ThirdPersonName", "ThirdPersonDesignation", "ThirdPersonAddress", "ThirdPersonContactNo", "CableTVChannel", "ReferenceStudentClass", "StaffMemberName",
        "StaffMemberDesignation", "NewspaperName", "CommentsDetail", "Locked", "SmartCardIssued", "SmartCardIssuedDate", "EntranceTest1", "EntranceTest1RollNo",
        "EntranceTest1Rank", "EntranceTest2", "EntranceTest2RollNo", "EntranceTest2Rank"
      ];

      fieldMapping.forEach((field) => {
        let val = studentRow[field];
        if (val === undefined || val === null) {
          val = null;
        } else if (val instanceof Date) {
          val = `${String(val.getMonth() + 1).padStart(2, '0')}/${String(val.getDate()).padStart(2, '0')}/${val.getFullYear()}`;
        }
        request.input(field, val);
      });

      request.input("UserID", sql.VarChar(100), username || studentRow["UserID"] || null);

      const cols = fieldMapping.concat(["UserID"]);

      const insertQuery = `
        INSERT INTO Admissions (
          ${cols.join(", ")}
        ) VALUES (
          ${cols.map(c => `@${c}`).join(", ")}
        );
      `;

      await request.query(insertQuery);
      console.log(`[CancelRestore Repository] Student IDNo ${idNo} restored to Admissions table.`);

      // 4. Delete from CancelledAdmission table
      const delReq = pool.request();
      delReq.input("IDNo", sql.VarChar(100), cleanId);
      const delRes = await delReq.query(`
        DELETE FROM CancelledAdmission 
        WHERE IDNo = @IDNo OR CAST(IDNo AS VARCHAR(100)) = @IDNo;
      `);
      console.log(`[CancelRestore Repository] Student IDNo ${cleanId} deleted from CancelledAdmission table. rowsAffected:`, delRes.rowsAffected);

      return true;
    } catch (err) {
      console.error("[CancelRestore Repository] restoreAdmission error:", err.message || err);
      throw err;
    }
  }
}

module.exports = new CancelRestoreRepository();

