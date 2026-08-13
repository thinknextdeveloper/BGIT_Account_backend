// models/debitModel.js
const { sql, getPool } = require("../config/db");
const { calcReceiptNo, genTransactionId } = require("./admissionFeeModel");

/**
 * Pulls everything the "Student detail" panel needs when Student's type =
 * Old and an ID No. is entered — mirrors VB's Display() on txtIDNo_Leave.
 */
const getStudentByIdNo = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.NVarChar, idNo ? String(idNo) : null)
    .query(`
        SELECT
            IDNo, StudentType, CollegeName, Course, Batch, Class,
            ClassRollNo, UniRollNo, StudentName, FatherName, MotherName,
            Scheme, DOB, Sex, PermanentAddress, PhoneNo, StudentMobileNo,
            FatherMobileNo, MotherMobileNo, LateralEntry, HostelName, RoomType,
            BusRoute, Stopage, Category, Quota, Session, Snap, FeeCategory,
            Facility, HostelCharges, BusFee
        FROM Admissions
        WHERE IDNo=@IDNo
    `);
  return result.recordset[0];
};

const createStudent = async (payload, transaction) => {
  const {
    idNo, collegeName, course, batch, studentClass, classRollNo, uniRollNo,
    studentName, fatherName, motherName, scheme, dob, sex, permanentAddress,
    phoneNo, studentMobile, fatherMobile, motherMobile, lateralEntry, session,
  } = payload;

  const request = transaction ? transaction.request() : (await getPool()).request();

  await request
    .input("IDNo", sql.NVarChar, idNo ? String(idNo) : null)
    .input("StudentType", sql.NVarChar, "New")
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("Course", sql.NVarChar, course)
    .input("Batch", sql.Int, batch)
    .input("Class", sql.NVarChar, studentClass)
    .input("ClassRollNo", sql.NVarChar, classRollNo || null)
    .input("UniRollNo", sql.NVarChar, uniRollNo || null)
    .input("StudentName", sql.NVarChar, studentName)
    .input("FatherName", sql.NVarChar, fatherName)
    .input("MotherName", sql.NVarChar, motherName || null)
    .input("Scheme", sql.NVarChar, scheme || null)
    .input("DOB", sql.Date, dob || null)
    .input("Sex", sql.NVarChar, sex)
    .input("PermanentAddress", sql.NVarChar, permanentAddress || null)
    .input("PhoneNo", sql.NVarChar, phoneNo || null)
    .input("StudentMobile", sql.NVarChar, studentMobile || null)
    .input("FatherMobile", sql.NVarChar, fatherMobile || null)
    .input("MotherMobile", sql.NVarChar, motherMobile || null)
    .input("LateralEntry", sql.Bit, !!lateralEntry)
    .input("Session", sql.NVarChar, session || null)
    .query(`
      INSERT INTO Admissions
        (IDNo, StudentType, CollegeName, Course, Batch, Class, ClassRollNo,
         UniRollNo, StudentName, FatherName, MotherName, Scheme, DOB, Sex,
         PermanentAddress, PhoneNo, StudentMobile, FatherMobile, MotherMobile,
         LateralEntry, Session)
      VALUES
        (@IDNo, @StudentType, @CollegeName, @Course, @Batch, @Class, @ClassRollNo,
         @UniRollNo, @StudentName, @FatherName, @MotherName, @Scheme, @DOB, @Sex,
         @PermanentAddress, @PhoneNo, @StudentMobile, @FatherMobile, @MotherMobile,
         @LateralEntry, @Session)
    `);
};

const updateFacilityDetail = async (idNo, facility, transaction) => {
  const { hostelName, roomType, route, stopage, amount } = facility;
  const sets = [];
  const request = transaction ? transaction.request() : (await getPool()).request();
  request.input("IDNo", sql.NVarChar, idNo ? String(idNo) : null);

  if (hostelName !== undefined) { sets.push("HostelName=@HostelName"); request.input("HostelName", sql.NVarChar, hostelName); }
  if (roomType !== undefined) { sets.push("RoomType=@RoomType"); request.input("RoomType", sql.NVarChar, roomType); }
  if (route !== undefined) { sets.push("BusRoute=@BusRoute"); request.input("BusRoute", sql.NVarChar, route); }
  if (stopage !== undefined) { sets.push("Stopage=@Stopage"); request.input("Stopage", sql.NVarChar, stopage); }
  if (amount !== undefined && amount !== null && amount !== "") {
    if (route || stopage) {
      sets.push("BusFee=@FacilityFee");
      request.input("FacilityFee", sql.Decimal(18, 2), amount);
    } else if (hostelName || roomType) {
      sets.push("HostelCharges=@FacilityFee");
      request.input("FacilityFee", sql.Decimal(18, 2), amount);
    }
  }

  if (sets.length === 0) return;

  await request.query(`UPDATE Admissions SET ${sets.join(", ")} WHERE IDNo=@IDNo`);
};

const getSemesterId = async (semesterName) => {
  if (!semesterName) return null;
  const pool = await getPool();

  try {
    const res = await pool
      .request()
      .input("Semester", sql.NVarChar, String(semesterName).trim())
      .query(`SELECT TOP 1 TRY_CAST(SemesterID AS INT) AS SemesterID FROM MasterCourse WHERE Semester = @Semester AND SemesterID IS NOT NULL AND SemesterID <> ''`);
    if (res.recordset[0]?.SemesterID) {
      return Number(res.recordset[0].SemesterID);
    }
  } catch (e) {}

  try {
    const res = await pool
      .request()
      .input("Semester", sql.NVarChar, String(semesterName).trim())
      .query(`SELECT TOP 1 TRY_CAST(SemesterID AS INT) AS SemesterID FROM MasterSemester WHERE Semester = @Semester AND SemesterID IS NOT NULL AND SemesterID <> ''`);
    if (res.recordset[0]?.SemesterID) {
      return Number(res.recordset[0].SemesterID);
    }
  } catch (e) {}

  const lower = String(semesterName).trim().toLowerCase();
  if (lower === "first" || lower === "1st year" || lower === "1year" || lower === "1 year" || lower === "1st") return 1;
  if (lower === "second" || lower === "secound" || lower === "2nd year" || lower === "2ndyear" || lower === "2 year" || lower === "2nd") return 2;
  if (lower === "third" || lower === "3rd year" || lower === "3rdyear" || lower === "3 year" || lower === "3rd") return 3;
  if (lower === "fourth" || lower === "4th year" || lower === "4thyear" || lower === "4 year" || lower === "4th") return 4;
  if (lower === "fifth" || lower === "5th") return 5;
  if (lower === "sixth" || lower === "6th" || lower === "6-month") return 6;
  if (lower === "seventh" || lower === "7th") return 7;
  if (lower === "eighth" || lower === "eight" || lower === "8th" || lower === "internship") return 8;

  const numMatch = lower.match(/\d+/);
  if (numMatch) return parseInt(numMatch[0], 10);

  return 1;
};

const parseDateOnly = (dateVal) => {
  if (!dateVal) {
    const now = new Date();
    const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 60 * 60 * 1000));
    const yyyy = istDate.getFullYear();
    const mm = String(istDate.getMonth() + 1).padStart(2, "0");
    const dd = String(istDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const yyyy = dateVal.getFullYear();
    const mm = String(dateVal.getMonth() + 1).padStart(2, "0");
    const dd = String(dateVal.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const monthMap = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  };

  const parts = str.split(/[\/\-.\s]+/);
  if (parts.length === 3) {
    let [p1, p2, p3] = parts;
    const mLower = p2.toLowerCase().slice(0, 3);
    if (monthMap[mLower]) {
      const day = String(parseInt(p1, 10)).padStart(2, "0");
      const month = monthMap[mLower];
      const yNum = parseInt(p3, 10);
      const year = yNum < 100 ? String(2000 + yNum) : String(yNum);
      return `${year}-${month}-${day}`;
    }
    const mLower1 = p1.toLowerCase().slice(0, 3);
    if (monthMap[mLower1]) {
      const month = monthMap[mLower1];
      const day = String(parseInt(p2, 10)).padStart(2, "0");
      const yNum = parseInt(p3, 10);
      const year = yNum < 100 ? String(2000 + yNum) : String(yNum);
      return `${year}-${month}-${day}`;
    }
    if (/^\d+$/.test(p1) && /^\d+$/.test(p2) && /^\d+$/.test(p3)) {
      let n1 = parseInt(p1, 10);
      let n2 = parseInt(p2, 10);
      let n3 = parseInt(p3, 10);
      let year, month, day;
      if (n1 > 1000) {
        year = String(n1);
        month = String(n2).padStart(2, "0");
        day = String(n3).padStart(2, "0");
      } else {
        year = n3 < 100 ? String(2000 + n3) : String(n3);
        if (n1 > 12) {
          day = String(n1).padStart(2, "0");
          month = String(n2).padStart(2, "0");
        } else if (n2 > 12) {
          month = String(n1).padStart(2, "0");
          day = String(n2).padStart(2, "0");
        } else {
          day = String(n1).padStart(2, "0");
          month = String(n2).padStart(2, "0");
        }
      }
      return `${year}-${month}-${day}`;
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const now = new Date();
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 60 * 60 * 1000));
  return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, "0")}-${String(istDate.getDate()).padStart(2, "0")}`;
};

const saveDebitEntry = async (payload) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      idNo, collegeName, studentName, fatherName, course, studentClass,
      batch, classRollNo, uniRollNo, session, semester, semesterId: payloadSemesterId, category,
      modeOfAdmission, ledgerName, othersLedgerName, facilityAmount,
      refundEntry, concessionEntry, particulars, debit, remarks, userId,
      dateEntry, feeHeads,
    } = payload;

    const resolvedLedgerName = ledgerName === "Others" ? (othersLedgerName || "Others") : ledgerName;
    const transactionId = await genTransactionId(collegeName, transaction);
    const semesterId = payloadSemesterId || (await getSemesterId(semester));
    const formattedDateEntry = parseDateOnly(dateEntry);

    const ledgerRequest = transaction.request();
    await ledgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("DateEntry", sql.Date, formattedDateEntry)
      .input("IDNo", sql.NVarChar, idNo ? String(idNo) : null)
      .input("StudentName", sql.NVarChar, studentName)
      .input("FatherName", sql.NVarChar, fatherName)
      .input("Course", sql.NVarChar, course)
      .input("Class", sql.NVarChar, studentClass)
      .input("Batch", sql.Int, batch)
      .input("ClassRollNo", sql.NVarChar, classRollNo || null)
      .input("UniRollNo", sql.NVarChar, uniRollNo || null)
      .input("Semester", sql.NVarChar, semester || null)
      .input("SemesterID", sql.Int, semesterId || null)
      .input("Category", sql.NVarChar, category || null)
      .input("ModeOfAdmission", sql.NVarChar, modeOfAdmission || null)
      .input("Particulars", sql.NVarChar, particulars)
      .input("LedgerName", sql.NVarChar, resolvedLedgerName)
      .input("Debit", sql.Decimal(18, 2), debit)
      .input("ReceiptNo", sql.Int, null)
      .input("TransactionType", sql.NVarChar, "Debit")
      .input("ConcessionEntry", sql.NVarChar, concessionEntry || "No")
      .input("Remarks", sql.NVarChar, remarks || null)
      .input("TransactionID", sql.BigInt, transactionId)
      .input("Session", sql.NVarChar, session || null)
      .input("UserID", sql.NVarChar, userId || "711177")
      .query(`
        INSERT INTO Ledger
          (CollegeName, DateEntry, IDNo, StudentName, FatherName,
           Course, Class, Batch, ClassRollNo, UniRollNo, Semester, SemesterID, Category,
           ModeOfAdmission, Particulars, LedgerName, Debit, ReceiptNo,
           TransactionType, ConcessionEntry, Remarks, TransactionID,
           Session, UserID)
        VALUES
          (@CollegeName, @DateEntry, @IDNo, @StudentName, @FatherName,
           @Course, @Class, @Batch, @ClassRollNo, @UniRollNo, @Semester, @SemesterID, @Category,
           @ModeOfAdmission, @Particulars, @LedgerName, @Debit, @ReceiptNo,
           @TransactionType, @ConcessionEntry, @Remarks, @TransactionID,
           @Session, @UserID)
      `);

    // "Update Facility Detail" / Fee Heads breakdown logged into SubLedgers table
    if (Array.isArray(feeHeads) && feeHeads.length > 0) {
      for (const row of feeHeads) {
        const subRequest = transaction.request();
        const numVal = Number(row.credit ?? row.debit ?? 0);
        await subRequest
          .input("Session", sql.NVarChar, session || null)
          .input("CollegeName", sql.NVarChar, collegeName)
          .input("TransactionType", sql.NVarChar, "Debit")
          .input("TransactionID", sql.BigInt, transactionId)
          .input("LedgerName", sql.NVarChar, resolvedLedgerName)
          .input("ReceiptNo", sql.Int, null)
          .input("Subhead", sql.NVarChar, row.head)
          .input("Debit", sql.Decimal(18, 2), numVal > 0 ? numVal : null)
          .input("UserID", sql.NVarChar, userId || "711177")
          .query(`
            INSERT INTO SubLedgers
              (Session, CollegeName, TransactionType, TransactionID, LedgerName, ReceiptNo, Subhead, Debit, UserID)
            VALUES
              (@Session, @CollegeName, @TransactionType, @TransactionID, @LedgerName, @ReceiptNo, @Subhead, @Debit, @UserID)
          `);
      }
    } else if (facilityAmount) {
      const subRequest = transaction.request();
      await subRequest
        .input("Session", sql.NVarChar, session || null)
        .input("CollegeName", sql.NVarChar, collegeName)
        .input("TransactionType", sql.NVarChar, "Debit")
        .input("TransactionID", sql.BigInt, transactionId)
        .input("LedgerName", sql.NVarChar, resolvedLedgerName)
        .input("ReceiptNo", sql.Int, null)
        .input("Subhead", sql.NVarChar, resolvedLedgerName)
        .input("Debit", sql.Decimal(18, 2), facilityAmount)
        .input("UserID", sql.NVarChar, userId || "711177")
        .query(`
          INSERT INTO SubLedgers
            (Session, CollegeName, TransactionType, TransactionID, LedgerName, ReceiptNo, Subhead, Debit, UserID)
          VALUES
            (@Session, @CollegeName, @TransactionType, @TransactionID, @LedgerName, @ReceiptNo, @Subhead, @Debit, @UserID)
        `);
    }

    await transaction.commit();
    return { transactionId };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (e) {}
    throw err;
  }
};

// ---------- meta lookups for the form's dropdowns ----------

const getHostelNames = async (collegeName) => {
  const pool = await getPool();
  try {
    const result = await pool
      .request()
      .input("CollegeName", sql.NVarChar, collegeName)
      .query(`SELECT DISTINCT HostelName FROM MasterHostel WHERE CollegeName=@CollegeName`);
    return result.recordset.map((r) => r.HostelName);
  } catch {
    return [];
  }
};

const getRoomTypes = async () => {
  const pool = await getPool();
  try {
    const result = await pool.request().query(`SELECT DISTINCT RoomType FROM MasterRoomType`);
    return result.recordset.map((r) => r.RoomType);
  } catch (err) {
    try {
      const result = await pool.request().query(`SELECT DISTINCT RoomType FROM MasterHostel WHERE RoomType IS NOT NULL`);
      return result.recordset.map((r) => r.RoomType);
    } catch {
      return [];
    }
  }
};

const getRoutes = async (collegeName) => {
  const pool = await getPool();
  try {
    const result = await pool
      .request()
      .input("CollegeName", sql.NVarChar, collegeName)
      .query(`SELECT DISTINCT Route FROM MasterRoute WHERE CollegeName=@CollegeName`);
    return result.recordset.map((r) => r.Route);
  } catch {
    return [];
  }
};

const getStopages = async (route) => {
  const pool = await getPool();
  try {
    const result = await pool
      .request()
      .input("Route", sql.NVarChar, route)
      .query(`SELECT DISTINCT Stopage FROM MasterStopage WHERE Route=@Route`);
    return result.recordset.map((r) => r.Stopage);
  } catch {
    return [];
  }
};

const getSessions = async () => {
  const pool = await getPool();
  try {
    const result = await pool
      .request()
      .query(`SELECT Session FROM MasterSession ORDER BY CurrentSession DESC`);
    const sessions = result.recordset.map((r) => r.Session).filter(Boolean);
    if (sessions.length > 0) return Array.from(new Set(sessions));
  } catch (err) {
    console.error("Error in getSessions query 1:", err.message);
  }
  try {
    const result = await pool
      .request()
      .query(`SELECT Session FROM MasterSession`);
    const sessions = result.recordset.map((r) => r.Session).filter(Boolean);
    if (sessions.length > 0) return Array.from(new Set(sessions));
  } catch (err) {
    console.error("Error in getSessions query 2:", err.message);
  }
  return [
    "2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22",
    "2020-21", "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
    "2014-15", "2013-14"
  ];
};

const getSemesters = async () => {
  const pool = await getPool();
  const semSet = new Set();

  try {
    const r1 = await pool
      .request()
      .query(`SELECT DISTINCT Semester FROM MasterAnnualFee WHERE Semester IS NOT NULL AND Semester <> ''`);
    r1.recordset.forEach((r) => semSet.add(r.Semester));
  } catch {}

  try {
    const r2 = await pool
      .request()
      .query(`SELECT DISTINCT Semester FROM MasterSemester WHERE Semester IS NOT NULL AND Semester <> ''`);
    r2.recordset.forEach((r) => semSet.add(r.Semester));
  } catch {}

  try {
    const r3 = await pool
      .request()
      .query(`SELECT DISTINCT Semester FROM Ledger WHERE Semester IS NOT NULL AND Semester <> ''`);
    r3.recordset.forEach((r) => semSet.add(r.Semester));
  } catch {}

  const list = Array.from(semSet);
  if (list.length > 0) return list;

  return [
    "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Eight",
    "1st Year", "1Year", "1 Year", "2nd Year", "2ndYear", "2 Year", "3rdYear", "3rd Year",
    "4thYear", "4th Year", "6-Month", "Internship", "Secound"
  ];
};

/**
 * Saves debit entries for all students in a given College, Course, and Batch
 * (optionally filtered by StudentType).
 */
const saveCourseDebitEntries = async (payload) => {
  const { collegeName, course, batch, courseStudentType, ...rest } = payload;
  const pool = await getPool();

  let query = `
    SELECT IDNo, StudentName, FatherName, Course, Class, Batch, ClassRollNo, UniRollNo
    FROM Admissions
    WHERE CollegeName = @CollegeName AND Course = @Course AND Batch = @Batch
  `;

  const request = pool.request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("Course", sql.NVarChar, course)
    .input("Batch", sql.Int, batch);

  if (courseStudentType === "New" || courseStudentType === "Old") {
    query += ` AND StudentType = @StudentType`;
    request.input("StudentType", sql.NVarChar, courseStudentType);
  }

  const result = await request.query(query);
  const students = result.recordset;

  let count = 0;
  for (const st of students) {
    await saveDebitEntry({
      idNo: st.IDNo,
      collegeName,
      studentName: st.StudentName,
      fatherName: st.FatherName,
      course: st.Course,
      studentClass: st.Class,
      batch: st.Batch,
      classRollNo: st.ClassRollNo,
      uniRollNo: st.UniRollNo,
      ...rest,
    });
    count++;
  }

  return count;
};

module.exports = {
  getStudentByIdNo,
  createStudent,
  updateFacilityDetail,
  saveDebitEntry,
  saveCourseDebitEntries,
  getHostelNames,
  getRoomTypes,
  getRoutes,
  getStopages,
  getSessions,
  getSemesters,
};