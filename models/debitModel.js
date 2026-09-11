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
    .input("IDNo", sql.BigInt, idNo)
    .query(`
        SELECT
            IDNo, StudentType, CollegeName, Course, Batch, Class,
            ClassRollNo, UniRollNo, StudentName, FatherName, MotherName,
            Scheme, DOB, Sex, PermanentAddress, PhoneNo, StudentMobileNo,
            FatherMobileNo, MotherMobileNo, LateralEntry, HostelName, RoomType,
            BusRoute, Stopage, Category, Quota, Session, Snap
        FROM Admissions
        WHERE IDNo=@IDNo
    `);
  return result.recordset[0];
};
/**
 * Inserts a brand-new Admissions row when Student's type = New — mirrors
 * the manual entry path in VB where all txtboxes are typed in fresh before
 * btnAdd_Click, instead of Display() populating them from a lookup.
 */
const createStudent = async (payload, transaction) => {
  const {
    idNo, collegeName, course, batch, studentClass, classRollNo, uniRollNo,
    studentName, fatherName, motherName, scheme, dob, sex, permanentAddress,
    phoneNo, studentMobile, fatherMobile, motherMobile, lateralEntry, session,
  } = payload;

  const request = transaction ? transaction.request() : (await getPool()).request();

  await request
    .input("IDNo", sql.BigInt, idNo)
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

/**
 * Writes Hostel Name / Room Type / Route / Stopage back onto Admissions —
 * mirrors the "Update Facility Detail" checkboxes: only the ticked fields
 * are touched, same as VB only sending the checked chkboxes' values.
 */
const updateFacilityDetail = async (idNo, facility, transaction) => {
  const { hostelName, roomType, route, stopage } = facility;
  const sets = [];
  const request = transaction ? transaction.request() : (await getPool()).request();
  request.input("IDNo", sql.BigInt, idNo);

  if (hostelName !== undefined) { sets.push("HostelName=@HostelName"); request.input("HostelName", sql.NVarChar, hostelName); }
  if (roomType !== undefined)   { sets.push("RoomType=@RoomType");     request.input("RoomType", sql.NVarChar, roomType); }
  if (route !== undefined)      { sets.push("BusRoute=@BusRoute");     request.input("BusRoute", sql.NVarChar, route); }
  if (stopage !== undefined)    { sets.push("Stopage=@Stopage");       request.input("Stopage", sql.NVarChar, stopage); }

  if (sets.length === 0) return;

  await request.query(`UPDATE Admissions SET ${sets.join(", ")} WHERE IDNo=@IDNo`);
};

/**
 * Inserts one Debit row into Ledger — mirrors btnAdd_Click for this form.
 * Unlike saveFeeEntry (which Credits the Fee ledger on receipt), this Debits
 * whichever ledger is selected (Fee/Hostel/Bus/Others), optionally logging a
 * facility Amount as a SubLedgers row so it nets against the head later.
 */
const saveDebitEntry = async (payload) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      idNo, collegeName, studentName, fatherName, course, studentClass,
      batch, classRollNo, uniRollNo, session, semester, category,
      modeOfAdmission, ledgerName, othersLedgerName, facilityAmount,
      refundEntry, concessionEntry, particulars, debit, remarks, userId,
      dateEntry,
    } = payload;

    const resolvedLedgerName = ledgerName === "Others" ? othersLedgerName : ledgerName;
    const receiptNo = await calcReceiptNo(collegeName, resolvedLedgerName, session, transaction);
    const transactionId = await genTransactionId(collegeName, transaction);

    const ledgerRequest = transaction.request();
    await ledgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("DateEntry", sql.DateTime, dateEntry)
      .input("DayBookDateEntry", sql.DateTime, new Date())
      .input("IDNo", sql.BigInt, idNo)
      .input("StudentName", sql.NVarChar, studentName)
      .input("FatherName", sql.NVarChar, fatherName)
      .input("Course", sql.NVarChar, course)
      .input("Class", sql.NVarChar, studentClass)
      .input("Batch", sql.Int, batch)
      .input("ClassRollNo", sql.NVarChar, classRollNo || null)
      .input("UniRollNo", sql.NVarChar, uniRollNo || null)
      .input("Semester", sql.NVarChar, semester || null)
      .input("Category", sql.NVarChar, category || null)
      .input("ModeOfAdmission", sql.NVarChar, modeOfAdmission || null)
      .input("Particulars", sql.NVarChar, particulars)
      .input("LedgerName", sql.NVarChar, resolvedLedgerName)
      .input("Debit", sql.Decimal(18, 2), debit)
      .input("ReceiptNo", sql.Int, receiptNo)
      .input("TransactionType", sql.NVarChar, "Debit")
      .input("RefundEntry", sql.NVarChar, refundEntry || "No")
      .input("ConcessionEntry", sql.NVarChar, concessionEntry || "No")
      .input("Remarks", sql.NVarChar, remarks || null)
      .input("TransactionID", sql.BigInt, transactionId)
      .input("Session", sql.NVarChar, session || null)
      .input("UserID", sql.NVarChar, userId || null)
      .query(`
        INSERT INTO Ledger
          (CollegeName, DateEntry, DayBookDateEntry, IDNo, StudentName, FatherName,
           Course, Class, Batch, ClassRollNo, UniRollNo, Semester, Category,
           ModeOfAdmission, Particulars, LedgerName, Debit, ReceiptNo,
           TransactionType, RefundEntry, ConcessionEntry, Remarks, TransactionID,
           Session, UserID)
        VALUES
          (@CollegeName, @DateEntry, @DayBookDateEntry, @IDNo, @StudentName, @FatherName,
           @Course, @Class, @Batch, @ClassRollNo, @UniRollNo, @Semester, @Category,
           @ModeOfAdmission, @Particulars, @LedgerName, @Debit, @ReceiptNo,
           @TransactionType, @RefundEntry, @ConcessionEntry, @Remarks, @TransactionID,
           @Session, @UserID)
      `);

    // "Update Facility Detail" Amount, if the person also ticked a facility
    // checkbox in the same submit — logged as its own SubLedgers row so it
    // can be attributed back to Hostel/Bus heads like getFeeStructureWithBalances does.
    if (facilityAmount) {
      const subRequest = transaction.request();
      await subRequest
        .input("Session", sql.NVarChar, session || null)
        .input("CollegeName", sql.NVarChar, collegeName)
        .input("TransactionType", sql.NVarChar, "Debit")
        .input("TransactionID", sql.BigInt, transactionId)
        .input("LedgerName", sql.NVarChar, resolvedLedgerName)
        .input("ReceiptNo", sql.Int, receiptNo)
        .input("Subhead", sql.NVarChar, resolvedLedgerName)
        .input("Debit", sql.Decimal(18, 2), facilityAmount)
        .input("UserID", sql.NVarChar, userId || null)
        .query(`
          INSERT INTO SubLedgers
            (Session, CollegeName, TransactionType, TransactionID, LedgerName, ReceiptNo, Subhead, Debit, UserID)
          VALUES
            (@Session, @CollegeName, @TransactionType, @TransactionID, @LedgerName, @ReceiptNo, @Subhead, @Debit, @UserID)
        `);
    }

    await transaction.commit();
    return { receiptNo, transactionId };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ---------- meta lookups for the form's dropdowns ----------

const getHostelNames = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT HostelName FROM MasterHostel WHERE CollegeName=@CollegeName`);
  return result.recordset.map((r) => r.HostelName);
};

const getRoomTypes = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT DISTINCT RoomType FROM MasterRoomType`);
  return result.recordset.map((r) => r.RoomType);
};

const getRoutes = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT Route FROM MasterRoute WHERE CollegeName=@CollegeName`);
  return result.recordset.map((r) => r.Route);
};

const getStopages = async (route) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Route", sql.NVarChar, route)
    .query(`SELECT DISTINCT Stopage FROM MasterStopage WHERE Route=@Route`);
  return result.recordset.map((r) => r.Stopage);
};

module.exports = {
  getStudentByIdNo,
  createStudent,
  updateFacilityDetail,
  saveDebitEntry,
  getHostelNames,
  getRoomTypes,
  getRoutes,
  getStopages,
};