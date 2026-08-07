// controllers/debitController.js
const {
  getStudentByIdNo,
  createStudent,
  updateFacilityDetail,
  saveDebitEntry,
  getHostelNames,
  getRoomTypes,
  getRoutes,
  getStopages,
} = require("../models/debitModel");

const {
  getCategories,
  getModesOfAdmission,
  getCurrentMasterSession,
} = require("../models/admissionFeeModel");
const { getPool, sql } = require("../config/db");
// const sql = require("mssql");


// controllers/debitController.js — replace getFeeHeads with this

const getFeeHeads = async (req, res) => {
  try {
    const { idNo, semester, feeCategory } = req.query;

    if (!idNo || !semester || !feeCategory) {
      return res.status(400).json({
        success: false,
        message: "idNo, semester, and feeCategory are required",
      });
    }

    const pool = await getPool();

    // 1. Look up the student to get CollegeName / Course / Batch
    const studentResult = await pool
      .request()
      .input("IDNo", sql.BigInt, idNo)
      .query(`
        SELECT CollegeName, Course, Batch
        FROM Admissions
        WHERE IDNo = @IDNo
      `);

    const student = studentResult.recordset[0];
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // 2. Resolve FeeCategory name -> FeeCategoryID (mirrors getcategoryid())
    const categoryResult = await pool
      .request()
      .input("FeeCategory", sql.VarChar, feeCategory)
      .input("CollegeName", sql.VarChar, student.CollegeName)
      .query(`
        SELECT FeeCategoryID
        FROM MasterFeeCategory
        WHERE FeeCategory = @FeeCategory AND CollegeName = @CollegeName
      `);

    const feeCategoryId = categoryResult.recordset[0]?.FeeCategoryID;
    if (!feeCategoryId) {
      return res.status(404).json({ success: false, message: "Fee category not found" });
    }

    // 3. Pull Heads + Amounts (mirrors ShowDebits1)
    const headsResult = await pool
      .request()
      .input("CollegeName", sql.VarChar, student.CollegeName)
      .input("Course", sql.VarChar, student.Course)
      .input("Batch", sql.VarChar, String(student.Batch))
      .input("Semester", sql.VarChar, semester)
      .input("FeeCategoryID", sql.VarChar, String(feeCategoryId))
      .query(`
        SELECT DISTINCT MasterHeads.Head, MasterAnnualFee.Amount AS Credit, MasterHeads.ID
        FROM MasterHeads
        LEFT JOIN MasterAnnualFee
          ON MasterHeads.CollegeName = MasterAnnualFee.CollegeName
          AND MasterHeads.Head = MasterAnnualFee.Head
        WHERE MasterAnnualFee.CollegeName = @CollegeName
          AND MasterAnnualFee.Batch = @Batch
          AND MasterAnnualFee.Course = @Course
          AND MasterAnnualFee.Semester = @Semester
          AND MasterAnnualFee.FeeCategory = @FeeCategoryID
          AND MasterHeads.CollegeName = @CollegeName
          AND MasterHeads.Head <> 'Late Fee'
        ORDER BY MasterHeads.ID
      `);

    const feeHeads = headsResult.recordset.map((row) => ({
      head: row.Head,
      credit: row.Credit || 0,
    }));

    return res.status(200).json({ success: true, feeHeads });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Fires when Student's type = Old and an ID No. is entered — mirrors VB's
 * txtIDNo_Leave calling Display() to fill the whole Student detail panel.
 */
const findStudent = async (req, res) => {
  try {
    const { idNo } = req.params;
    const student = await getStudentByIdNo(idNo);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({ success: true, student });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * btnAdd_Click — validates the same fields VB checked (ID No., Ledger,
 * Debit amount), creates the student first if Student's type = New, applies
 * any ticked facility-detail fields, then inserts the Debit entry.
 */
const saveDebit = async (req, res) => {
  try {
    const { idNo } = req.params;
    const body = req.body;

    if (!idNo) {
      return res.status(400).json({ success: false, message: "ID No. is required" });
    }
    if (!body.ledgerName) {
      return res.status(400).json({ success: false, message: "Please select a Ledger" });
    }
    if (body.ledgerName === "Others" && !body.othersLedgerName) {
      return res.status(400).json({ success: false, message: "Please select an Others ledger" });
    }
    if (!body.debit || Number(body.debit) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Debit Amount" });
    }

    let student;
    if (body.studentType === "New") {
      student = await getStudentByIdNo(idNo);
      if (student) {
        return res.status(400).json({ success: false, message: "ID No. already exists — use Student's type: Old" });
      }
      await createStudent({ idNo, ...body.studentDetail }, null);
      student = await getStudentByIdNo(idNo);
    } else {
      student = await getStudentByIdNo(idNo);
      if (!student) {
        return res.status(404).json({ success: false, message: "No student found with this ID No." });
      }
    }

    if (body.facility && (body.facility.hostelName || body.facility.roomType || body.facility.route || body.facility.stopage)) {
      await updateFacilityDetail(idNo, body.facility, null);
    }

    const { receiptNo, transactionId } = await saveDebitEntry({
      idNo,
      collegeName: student.CollegeName,
      studentName: student.StudentName,
      fatherName: student.FatherName,
      course: student.Course,
      studentClass: student.Class,
      batch: student.Batch,
      classRollNo: student.ClassRollNo,
      uniRollNo: student.UniRollNo,
      session: body.session,
      semester: body.semester,
      category: body.category,
      modeOfAdmission: body.modeOfAdmission,
      ledgerName: body.ledgerName,
      othersLedgerName: body.othersLedgerName,
      facilityAmount: body.facility?.amount || null,
      refundEntry: body.refundEntry,
      concessionEntry: body.concessionEntry,
      particulars: body.particulars,
      debit: body.debit,
      remarks: body.remarks,
      userId: req.user?.id || body.userId || null,
      dateEntry: body.dateEntry ? new Date(body.dateEntry) : new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Entry has been Saved Successfully",
      receiptNo,
      transactionId,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Populates every dropdown on the page in one call — Ledgers > Others,
 * Update Facility Detail (Hostel Name / Room Type / Route / Stopage), and
 * the Debit panel's All Category / All Mode of Admission.
 */
const getMetaOptions = async (req, res) => {
  try {
    const { collegeName, route } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }

    const [hostelNames, roomTypes, routes, stopages, categories, modesOfAdmission, currentSession] =
      await Promise.all([
        getHostelNames(collegeName),
        getRoomTypes(),
        getRoutes(collegeName),
        route ? getStopages(route) : Promise.resolve([]),
        getCategories(collegeName),
        getModesOfAdmission(),
        getCurrentMasterSession(),
      ]);

    return res.status(200).json({
      success: true,
      hostelNames,
      roomTypes,
      routes,
      stopages,
      categories,
      modesOfAdmission,
      currentSession,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = {
  findStudent,
  saveDebit,
  getMetaOptions,
  getFeeHeads,
  
};