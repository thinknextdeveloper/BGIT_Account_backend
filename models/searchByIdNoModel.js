const { sql, getPool } = require("../config/db");

/**
 * Resolves FeeCategoryID (numeric ID e.g. '14', '13') from category name/ID and college name
 */
async function getCategoryId(varCategory, varcollege) {
  console.log("[getCategoryId] Input varCategory:", varCategory, "| varcollege:", varcollege);
  if (!varCategory) {
    console.log(" [getCategoryId] varCategory is empty!");
    return "";
  }
  const cleanCat = String(varCategory).trim();

  // If it's already a numeric ID (e.g. "14", "13"), return it directly
  if (!isNaN(Number(cleanCat)) && cleanCat !== "") {
    console.log(" [getCategoryId] varCategory is already numeric FeeCategoryID:", cleanCat);
    return cleanCat;
  }

  const pool = await getPool();
  const cleanCol = String(varcollege || "").trim();

  // 1. Try MasterFeeCategory with college matching (exact columns: FeeCategoryID, FeeCategory, CollegeName)
  try {
    const res = await pool.request().query(`
      SELECT TOP 1 FeeCategoryID
      FROM MasterFeeCategory
      WHERE FeeCategory = '${cleanCat.replace(/'/g, "''")}'
        AND (
          CollegeName = '${cleanCol.replace(/'/g, "''")}'
          OR REPLACE(CollegeName, ' ', '') = '${cleanCol.replace(/\s+/g, "").replace(/'/g, "''")}'
          OR CollegeName LIKE '${cleanCol.replace(/'/g, "''")}%'
          OR '${cleanCol.replace(/'/g, "''")}' LIKE CollegeName + '%'
        )
    `);
    const val = res.recordset[0]?.FeeCategoryID;
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      console.log(" [getCategoryId] Step 1 (MasterFeeCategory with College) matched FeeCategoryID:", String(val));
      return String(val);
    }
  } catch (err) {
    console.error(" [getCategoryId] Step 1 error:", err.message);
  }

  // 2. Try MasterFeeCategory without college constraint
  try {
    const res = await pool.request().query(`
      SELECT TOP 1 FeeCategoryID
      FROM MasterFeeCategory
      WHERE FeeCategory = '${cleanCat.replace(/'/g, "''")}'
    `);
    const val = res.recordset[0]?.FeeCategoryID;
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      console.log("[getCategoryId] Step 2 (MasterFeeCategory without College) matched FeeCategoryID:", String(val));
      return String(val);
    }
  } catch (err) {
    console.error("[getCategoryId] Step 2 error:", err.message);
  }

  console.log(" [getCategoryId] Could not resolve FeeCategoryID from tables. Returning cleanCat:", cleanCat);
  return cleanCat;
}

/**
 * Resolves current semester — mirrors frmdebit.ShowCurSemester(college, course, batch)
 */
async function showCurSemester(varcollege, varcourse, varbatch) {
  if (!varcollege && !varcourse) return "First";
  const pool = await getPool();
  const cleanCol = String(varcollege || "").trim();
  const cleanCourse = String(varcourse || "").trim();
  const cleanBatch = String(varbatch || "").trim();

  try {
    const res = await pool.request().query(`
      SELECT TOP 1 CurrentSemester, Semester
      FROM MasterCurrentSemester
      WHERE Course = '${cleanCourse.replace(/'/g, "''")}' AND CAST(Batch AS VARCHAR(50)) = '${cleanBatch.replace(/'/g, "''")}'
        AND (
          CollegeName = '${cleanCol.replace(/'/g, "''")}'
          OR REPLACE(CollegeName, ' ', '') = '${cleanCol.replace(/\s+/g, "").replace(/'/g, "''")}'
          OR CollegeName LIKE '${cleanCol.replace(/'/g, "''")}%'
          OR '${cleanCol.replace(/'/g, "''")}' LIKE CollegeName + '%'
        )
    `);
    if (res.recordset[0]) {
      const sem = res.recordset[0].CurrentSemester || res.recordset[0].Semester;
      if (sem) return sem;
    }
  } catch (err) { }

  try {
    const res2 = await pool.request().query(`
      SELECT TOP 1 CurrentSemester, Semester
      FROM Semesters
      WHERE Course = '${cleanCourse.replace(/'/g, "''")}' AND CAST(Batch AS VARCHAR(50)) = '${cleanBatch.replace(/'/g, "''")}'
        AND (
          CollegeName = '${cleanCol.replace(/'/g, "''")}'
          OR REPLACE(CollegeName, ' ', '') = '${cleanCol.replace(/\s+/g, "").replace(/'/g, "''")}'
          OR CollegeName LIKE '${cleanCol.replace(/'/g, "''")}%'
          OR '${cleanCol.replace(/'/g, "''")}' LIKE CollegeName + '%'
        )
    `);
    if (res2.recordset[0]) {
      const sem = res2.recordset[0].CurrentSemester || res2.recordset[0].Semester;
      if (sem) return sem;
    }
  } catch (err) { }

  return "First";
}

/**
 * Executes ShowDebits matching the VB method exactly:
 * SELECT distinct MasterHeads.Head, MasterAnnualFee.Amount As Credit, MasterAnnualFee.Amount AS Debit, MasterHeads.ID
 * FROM MasterHeads
 * Left JOIN MasterAnnualFee ON MasterHeads.CollegeName = MasterAnnualFee.CollegeName and MasterHeads.Head=MasterAnnualFee.Head
 * and MasterAnnualFee.CollegeName='...' [and Course=...] [and Batch=...] [and Semester=...] [and FeeCategory=...]
 * where MasterHeads.CollegeName='...'
 * order by MasterHeads.ID
 */
async function showDebits(varcollege, varcourse, varbatch, varsemester, varCategory) {
  const pool = await getPool();

  const cleanCol = String(varcollege || "").trim();
  const cleanCourse = String(varcourse || "").trim();
  const cleanBatch = String(varbatch || "").trim();
  const semester = String(varsemester || "First").trim();
  const rawCat = String(varCategory || "").trim();

  // 1. Resolve matching CollegeName in MasterHeads
  let targetCollege = cleanCol;
  try {
    const colRes = await pool.request().query(`
      SELECT DISTINCT TOP 1 CollegeName
      FROM MasterHeads
      WHERE CollegeName = '${cleanCol.replace(/'/g, "''")}'
         OR REPLACE(CollegeName, ' ', '') = '${cleanCol.replace(/\s+/g, "").replace(/'/g, "''")}'
         OR CollegeName LIKE '${cleanCol.replace(/'/g, "''")}%'
         OR '${cleanCol.replace(/'/g, "''")}' LIKE CollegeName + '%'
    `);
    if (colRes.recordset[0]?.CollegeName) {
      targetCollege = colRes.recordset[0].CollegeName;
    }
  } catch (err) { }

  const escapeSql = (str) => String(str || "").replace(/'/g, "''");

  let sqlQuery = `SELECT distinct MasterHeads.Head, MasterAnnualFee.Amount As Credit, MasterAnnualFee.Amount AS Debit, MasterHeads.ID FROM MasterHeads Left JOIN MasterAnnualFee ON MasterHeads.CollegeName = MasterAnnualFee.CollegeName and MasterHeads.Head=MasterAnnualFee.Head and MasterAnnualFee.CollegeName='${escapeSql(targetCollege)}'`;

  if (cleanCourse) {
    sqlQuery += ` And MasterAnnualFee.Course='${escapeSql(cleanCourse)}'`;
  }
  if (cleanBatch) {
    sqlQuery += ` And MasterAnnualFee.Batch=${cleanBatch}`;
  }
  if (semester) {
    sqlQuery += ` And MasterAnnualFee.Semester='${escapeSql(semester)}'`;
  }
  if (rawCat) {
    const feecategoryid = await getCategoryId(rawCat, targetCollege);
    console.log(" [showDebits] Resolved FeeCategoryID:", feecategoryid);
    sqlQuery += ` And MasterAnnualFee.FeeCategory='${escapeSql(feecategoryid)}'`;
  }

  sqlQuery += ` where MasterHeads.CollegeName='${escapeSql(targetCollege)}' order by MasterHeads.ID`;

  console.log("🚀 Executing SQL Query:", sqlQuery);

  let res = await pool.request().query(sqlQuery);
  let rows = res.recordset || [];

  // Fallback if 0 rows: try fetching directly from MasterHeads
  if (rows.length === 0) {
    try {
      const fallbackRes = await pool.request().query(`
        SELECT distinct Head, NULL AS Credit, NULL AS Debit, ID
        FROM MasterHeads
        WHERE CollegeName = '${escapeSql(targetCollege)}'
        ORDER BY ID
      `);
      rows = fallbackRes.recordset || [];
    } catch (e) { }
  }

  // CalcTotalCredit: sum valid numeric credit amounts
  let totalDebit = 0;
  const heads = rows.map((r) => {
    const amt = r.Credit !== null && r.Credit !== undefined && !isNaN(Number(r.Credit)) ? Number(r.Credit) : null;
    if (amt !== null) {
      totalDebit += amt;
    }
    return {
      Head: r.Head,
      Credit: amt !== null ? amt : "",
      Debit: r.Debit !== null && r.Debit !== undefined && !isNaN(Number(r.Debit)) ? Number(r.Debit) : "",
      ID: r.ID,
    };
  });

  return { heads, totalDebit };
}

/**
 * Searches full student details by IDNo.
 * @param {{idNo: string|number}} params
 */
async function getStudentDetailsByIdNo(idNo) {
  const pool = await getPool();
  const req = pool.request();
  req.input("IDNo", sql.BigInt, idNo);

  // 1. Admission row
  const admResult = await req.query(`
    select CollegeName, Course, Class, Batch, Section, GroupName, IDNo, ClassRollNo, UniRollNo,
           LateralEntry, AdmissionDate, StudentName, Sex, FatherName, MotherName, DOB,
           CorrespondanceAddress, PermanentAddress, StudentMobileNo, PhoneNo, FatherMobileNo,
           MotherMobileNo, EmailID, FatherOccupation, MotherOccupation, FatherDesignation,
           FatherEmailID, Facility, BusRoute, RouteID, Stopage, FeeWaiverScheme, StopageID,
           HostelName, RoomType, HostelCharges, BusFee, StudentType, Concession, ConcessionDetails,
           ConcessionPerc, ConcessionTotalAmount, BloodGroup, Category, FeeCategory, Locality, Medium,
           METRank, METRollNo, Quota, FirstPreference, SecondPreference, ThirdPreference,
           FourthPreference, Scheme, InstitutionLastAttended, University, State, Religion,
           SeatConfirmed, City, BoardRegistrationNo, MET, ConcessionReferenceLetterNo,
           Village, VPO, PO, Tehsil, District, GuardianAddress, GuardianContactNo, Nationality,
           PreviousMedicalIllness, OtherEntranceTest, NSS, Sports, OtherAchievements, UserID,
           EnquiryNo, EnquiryDate, RegistrationNo, RegistrationDate, Snap, CardIssued,
           CardIssuedDate, ValidUpTo, LastExam, Board, LastExamPerc, Newspaper, ThirdPerson,
           CableTV, Student, StaffMember, FlexBoard, Pamphlet, Comments, ThirdPersonName,
           ThirdPersonDesignation, ThirdPersonAddress, ThirdPersonContactNo, CableTVChannel,
           ReferenceStudentClass, StaffMemberName, StaffMemberDesignation, NewspaperName,
           CommentsDetail, Locked, SmartCardIssued, SmartCardIssuedDate, EntranceTest1,
           EntranceTest1RollNo, EntranceTest1Rank, EntranceTest2, EntranceTest2RollNo, EntranceTest2Rank
    from Admissions
    where IDNo = @IDNo
  `);

  const admission = admResult.recordset[0] || null;
  if (!admission) return null;

  const college = admission.CollegeName || "";
  const course = admission.Course || "";
  const batch = admission.Batch || "";
  const category = (admission.FeeCategory !== null && admission.FeeCategory !== undefined && String(admission.FeeCategory).trim() !== "")
    ? String(admission.FeeCategory).trim()
    : String(admission.Category || "").trim();

  // 2. ShowCurSemester
  let semester = await showCurSemester(college, course, batch);
  if (!semester) {
    semester = admission.Semester || "First";
  }

  // 3. ShowledgerentryFee
  let concessionFeeAmount = "";
  try {
    const feeReq = pool.request();
    feeReq.input("IDNo", sql.BigInt, idNo);
    const feeRes = await feeReq.query(`
      select Debit from Ledger where IDNo = @IDNo And ConcessionEntry = 'Yes' And LedgerName = 'Fee'
    `);
    if (feeRes.recordset[0]?.Debit !== undefined && feeRes.recordset[0]?.Debit !== null) {
      concessionFeeAmount = feeRes.recordset[0].Debit;
    }
  } catch (err) { }

  // 4. ShowledgerentryFacility
  let concessionFacilityAmount = "";
  try {
    const facReq = pool.request();
    facReq.input("IDNo", sql.BigInt, idNo);
    const facRes = await facReq.query(`
      select Debit from Ledger where IDNo = @IDNo And ConcessionEntry = 'Yes' And LedgerName <> 'Fee'
    `);
    if (facRes.recordset[0]?.Debit !== undefined && facRes.recordset[0]?.Debit !== null) {
      concessionFacilityAmount = facRes.recordset[0].Debit;
    }
  } catch (err) { }

  // 5. ShowDebits
  const { heads, totalDebit } = await showDebits(college, course, batch, semester, category);

  // 6. Educational Qualifications (Academic1)
  let eduQualifications = [];
  try {
    const eduReq = pool.request();
    eduReq.input("IDNo", sql.BigInt, idNo);
    const eduRes = await eduReq.query(`
      select SerialNo, Course, SubjectsStudied, BoardUniv, MarksObtained, TotalMarks, Percentage, Remarks, YearOfPassing
      from EduQualification
      where IDNo = @IDNo
      order by SerialNo Asc
    `);
    eduQualifications = eduRes.recordset || [];
  } catch (err) { }

  const standardExams = ["Matric", "10+2/Diploma", "Graduation", "Other"];
  const formattedEdu = standardExams.map((exam, idx) => {
    const found = eduQualifications[idx] || {};
    return {
      SerialNo: idx + 1,
      ExamPassed: exam,
      Course: found.Course || "",
      SubjectsStudied: found.SubjectsStudied || "",
      BoardUniv: found.BoardUniv || "",
      YearOfPassing: found.YearOfPassing || "",
      MarksObtained: found.MarksObtained || "",
      TotalMarks: found.TotalMarks || "",
      Percentage: found.Percentage || "",
      Remarks: found.Remarks || "",
    };
  });

  // 7. Documents Required
  let documents = [];
  try {
    const docReq = pool.request();
    docReq.input("IDNo", sql.BigInt, idNo);
    const docRes = await docReq.query(`
      select * from DocumentStatus where IDNo = @IDNo order by SerialNo Asc
    `);
    if (docRes.recordset && docRes.recordset.length > 0) {
      documents = docRes.recordset;
    } else if (college) {
      const mDocReq = pool.request();
      mDocReq.input("college", sql.VarChar, college);
      const mDocRes = await mDocReq.query(`
        select SerialNo, DocumentsRequired from MasterDocumentsRequired where College = @college order by SerialNo Asc
      `);
      documents = (mDocRes.recordset || []).map((r) => ({
        SerialNo: r.SerialNo,
        DocumentsRequired: r.DocumentsRequired,
        Status: "",
      }));
    }
  } catch (err) { }

  return {
    admission,
    semester,
    heads,
    totalDebit,
    concessionFeeAmount,
    concessionFacilityAmount,
    eduQualifications: formattedEdu,
    documents,
  };
}

module.exports = { getStudentDetailsByIdNo };
