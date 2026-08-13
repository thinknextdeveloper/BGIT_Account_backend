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
  getSessions,
  getSemesters,
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
    const { idNo, collegeName, course, batch, semester, feeCategory, ledgerName = "Fee" } = req.query;

    const cleanParam = (val) => {
      if (!val || val === "undefined" || val === "null" || String(val).trim() === "") return undefined;
      return String(val).trim();
    };

    const cleanIdNo = cleanParam(idNo);
    const cleanSemester = cleanParam(semester);
    const cleanFeeCategory = cleanParam(feeCategory);
    let targetCollege = cleanParam(collegeName);
    let targetCourse = cleanParam(course);
    let targetBatch = cleanParam(batch);

    const pool = await getPool();

    if (cleanIdNo) {
      const studentResult = await pool
        .request()
        .input("IDNo", sql.BigInt, cleanIdNo)
        .query(`
          SELECT CollegeName, Course, Batch, FeeCategory
          FROM Admissions
          WHERE IDNo = @IDNo
        `);

      const student = studentResult.recordset[0];
      if (student) {
        targetCollege = targetCollege || cleanParam(student.CollegeName);
        targetCourse = targetCourse || cleanParam(student.Course);
        targetBatch = targetBatch || cleanParam(student.Batch);
      }
    }

    if (!targetCollege || !cleanFeeCategory) {
      return res.status(400).json({
        success: false,
        message: "College and feeCategory are required",
      });
    }

    // Resolve FeeCategory name -> FeeCategoryID (mirrors getcategoryid())
    const categoryResult = await pool
      .request()
      .input("FeeCategory", sql.VarChar, cleanFeeCategory)
      .input("CollegeName", sql.VarChar, targetCollege)
      .query(`
        SELECT FeeCategoryID
        FROM MasterFeeCategory
        WHERE FeeCategory = @FeeCategory AND CollegeName = @CollegeName
      `);

    let feeCategoryId = categoryResult.recordset[0]?.FeeCategoryID || cleanFeeCategory;

    let headFilter = "";
    if (ledgerName === "Bus") {
      headFilter = "AND (MasterHeads.Head LIKE '%Bus%' OR MasterHeads.Head LIKE '%Transport%' OR MasterHeads.Head = 'Bus Fee')";
    } else if (ledgerName === "Hostel") {
      headFilter = "AND (MasterHeads.Head LIKE '%Hostel%' OR MasterHeads.Head = 'Hostel Fee')";
    } else if (ledgerName === "Fine") {
      headFilter = "AND (MasterHeads.Head LIKE '%Fine%' OR MasterHeads.Head LIKE '%Late%')";
    } else if (ledgerName === "Fee") {
      headFilter = "AND MasterHeads.Head <> 'Late Fee' AND MasterHeads.Head NOT LIKE '%Hostel%' AND MasterHeads.Head NOT LIKE '%Bus%' AND MasterHeads.Head NOT LIKE '%Transport%'";
    }
    const request = pool.request();
    request.input("CollegeName", sql.VarChar, targetCollege);

    let onConditions = ``;

    if (targetBatch && !isNaN(Number(targetBatch))) {
      onConditions += ` AND (MasterAnnualFee.Batch = @Batch OR CAST(MasterAnnualFee.Batch AS VARCHAR) = @BatchStr)`;
      request.input("Batch", sql.Int, Number(targetBatch));
      request.input("BatchStr", sql.VarChar, String(targetBatch));
    } else if (targetBatch) {
      onConditions += ` AND CAST(MasterAnnualFee.Batch AS VARCHAR) = @BatchStr`;
      request.input("BatchStr", sql.VarChar, String(targetBatch));
    }

    if (targetCourse) {
      onConditions += ` AND MasterAnnualFee.Course = @Course`;
      request.input("Course", sql.VarChar, targetCourse);
    }

    if (cleanSemester) {
      onConditions += ` AND MasterAnnualFee.Semester = @Semester`;
      request.input("Semester", sql.VarChar, cleanSemester);
    }

    if (feeCategoryId !== undefined && feeCategoryId !== null) {
      if (!isNaN(Number(feeCategoryId))) {
        onConditions += ` AND (MasterAnnualFee.FeeCategory = @FeeCategoryID OR CAST(MasterAnnualFee.FeeCategory AS VARCHAR) = @FeeCategoryStr)`;
        request.input("FeeCategoryID", sql.Int, Number(feeCategoryId));
        request.input("FeeCategoryStr", sql.VarChar, String(feeCategoryId));
      } else {
        onConditions += ` AND CAST(MasterAnnualFee.FeeCategory AS VARCHAR) = @FeeCategoryStr`;
        request.input("FeeCategoryStr", sql.VarChar, String(feeCategoryId));
      }
    }

    let query = `
      SELECT DISTINCT MasterHeads.Head, MasterAnnualFee.Amount AS Credit, MasterHeads.ID
      FROM MasterHeads
      LEFT JOIN MasterAnnualFee
        ON MasterHeads.CollegeName = MasterAnnualFee.CollegeName
        AND MasterHeads.Head = MasterAnnualFee.Head
        ${onConditions}
      WHERE MasterHeads.CollegeName = @CollegeName
      ${headFilter}
      ORDER BY MasterHeads.ID
    `;

    const headsResult = await request.query(query);

    let totalCredit = 0;
    const feeHeads = headsResult.recordset.map((row) => {
      const credit = row.Credit || 0;
      totalCredit += Number(credit);
      return {
        head: row.Head,
        credit: credit,
      };
    });

    return res.status(200).json({ success: true, feeHeads, totalCredit });
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

    if (!body.ledgerName) {
      return res.status(400).json({ success: false, message: "Please select a Ledger" });
    }
    if (body.ledgerName === "Others" && !body.othersLedgerName) {
      return res.status(400).json({ success: false, message: "Please select an Others ledger" });
    }
    if (!body.debit || Number(body.debit) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Debit Amount" });
    }

    if (body.debitFrom === "Course") {
      const { collegeName, course, batch, courseStudentType } = body;
      if (!collegeName || !course || !batch) {
        return res.status(400).json({ success: false, message: "College, Course, and Batch are required for Course debit" });
      }

      const count = await saveCourseDebitEntries({
        collegeName,
        course,
        batch,
        courseStudentType,
        session: body.session,
        semester: body.semester,
        semesterId: body.semesterId,
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
        dateEntry: body.dateEntry || null,
      });

      return res.status(200).json({
        success: true,
        message: `Course Debit Entries saved successfully for ${count} students.`,
        count,
      });
    }

    if (!idNo) {
      return res.status(400).json({ success: false, message: "ID No. is required" });
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

    // const { transactionId } = await saveDebitEntry({
    //   idNo,
    //   collegeName: student.CollegeName,
    //   studentName: student.StudentName,
    //   fatherName: student.FatherName,
    //   course: student.Course,
    //   studentClass: student.Class,
    //   batch: student.Batch,
    //   classRollNo: student.ClassRollNo,
    //   uniRollNo: student.UniRollNo,
    //   session: body.session,
    //   semester: body.semester,
    //   semesterId: body.semesterId,
    //   category: body.category,
    //   modeOfAdmission: body.modeOfAdmission,
    //   ledgerName: body.ledgerName,
    //   othersLedgerName: body.othersLedgerName,
    //   facilityAmount: body.facility?.amount || null,
    //   refundEntry: body.refundEntry,
    //   concessionEntry: body.concessionEntry,
    //   particulars: body.particulars,
    //   debit: body.debit,
    //   remarks: body.remarks,
    //   userId: req.user?.id || req.user?.userId || body.userId || "711177",
    //   dateEntry: body.dateEntry || null,
    //   feeHeads: body.feeHeads,
    // });
    const userId = req.user?.id || req.user?.userId || body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found. Please login again."
      });
    }

    const { transactionId } = await saveDebitEntry({
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
      semesterId: body.semesterId,
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
      userId,
      dateEntry: body.dateEntry || null,
      feeHeads: body.feeHeads,
    });
    return res.status(200).json({
      success: true,
      message: "Entry has been Saved Successfully",
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

    const [hostelNames, roomTypes, routes, stopages, categories, modesOfAdmission, currentSession, sessions, semesters] =
      await Promise.all([
        collegeName ? getHostelNames(collegeName) : Promise.resolve([]),
        getRoomTypes(),
        collegeName ? getRoutes(collegeName) : Promise.resolve([]),
        route ? getStopages(route) : Promise.resolve([]),
        collegeName ? getCategories(collegeName) : Promise.resolve([]),
        getModesOfAdmission(),
        getCurrentMasterSession(),
        getSessions(),
        getSemesters(),
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
      sessions,
      semesters,
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