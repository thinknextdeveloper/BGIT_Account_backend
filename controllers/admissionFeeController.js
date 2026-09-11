const {
  getStudentById,
  getLedger,
  getFeeHeads,
  saveFeeEntry,
  calcReceiptNo,
  getSchemes,
  getCategories,
  getModesOfAdmission,
  updateStudentAdmissionMeta,
  getFeeStructureWithBalances,
  getCurrentSemester,
  getCurrentMasterSession,
} = require("../models/admissionFeeModel");

/**
 * Loads a student + ledger + the structured Fee-heads grid. If no semester
 * was explicitly passed in, auto-resolves the current semester from
 * MasterCurrentSemester (College + Course + Batch) — mirrors VB's Display()
 * calling Module1.ShowCurSemester() right after populating student fields,
 * so cmbSemester.Text is pre-filled without the person picking it manually.
 */
const findStudent = async (req, res) => {
  try {
    const { idNo } = req.params;
    const { semester: requestedSemester, session } = req.query;

    const student = await getStudentById(idNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const ledger = await getLedger(idNo);

    let resolvedSemester = requestedSemester || null;
    if (!resolvedSemester) {
      resolvedSemester = await getCurrentSemester(
        student.CollegeName,
        student.Course,
        student.Batch
      );
    }

    const currentMasterSession = await getCurrentMasterSession();
    const targetSession = session || student.Session || currentMasterSession;
    let receiptNo = 1;
    if (targetSession) {
      receiptNo = await calcReceiptNo(student.CollegeName, "Fee", targetSession);
    }

    // student.Category holds what VB.NET calls FeeCategory (varFeeCat).
    // getStudentById() must SELECT it as `FeeCategory AS Category` for
    // this to ever be truthy — otherwise this branch fires on every call.
    if (!student.Category) {
      return res.status(200).json({
        success: true,
        student, ledger, feeHeads: [], receiptNo,
        session: targetSession, semester: resolvedSemester,
        warning: "Fee Category not assigned for this student. Please assign it first.",
      });
    }

    let feeHeads = [];
    if (resolvedSemester) {
      feeHeads = await getFeeStructureWithBalances({
        idNo,
        collegeName: student.CollegeName,
        course: student.Course,
        batch: student.Batch,
        semester: resolvedSemester,
        category: student.Category,
        session: targetSession,
      });
    }

    return res.status(200).json({
      success: true,
      student,
      ledger,
      feeHeads,
      receiptNo,
      session: targetSession,
      currentSession: currentMasterSession || student.Session,
      semester: resolvedSemester,
      warning: feeHeads.length === 0
        ? `No fee structure found for this student's course/batch/semester/category. Check that MasterHeads and MasterAnnualFee are configured for ${student.CollegeName}.`
        : null,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Saves a new fee entry and returns the refreshed ledger + feeHeads so the
 * frontend's data-entry grid (Date Entry / Particulars / LedgerName / Debit
 * / Credit table on the left, same one populated by ShowDgvDetail in VB)
 * updates immediately without a second round trip. feeHeads here uses the
 * same structured getFeeStructureWithBalances pipeline as findStudent, so
 * the right-hand Fee grid reflects the new balances right after saving —
 * mirrors VB's showCreditEntry() called right after the insert.
 */
const saveFee = async (req, res) => {
  try {
    const { idNo } = req.params;
    const body = req.body;

    if (!idNo) {
      return res.status(400).json({ success: false, message: "IDNo is required" });
    }
    if (!body.onAccountOf) {
      return res.status(400).json({ success: false, message: "OnAccountOf value is required" });
    }
    if (!body.semester) {
      return res.status(400).json({ success: false, message: "Semester is required" });
    }
    if (!body.totalCredit || Number(body.totalCredit) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Total Credit Amount" });
    }
    if (body.modeOfPayment && body.modeOfPayment !== "Cash") {
      if (!body.chequeDraftBank) {
        return res.status(400).json({ success: false, message: "Please Select Bank Name" });
      }
      if (!body.chequeDraftNo) {
        return res.status(400).json({ success: false, message: "Please Enter Cheque/Draft/Transaction No." });
      }
    }

    const student = await getStudentById(idNo);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    function parseDDMonYY(str) {
      if (!str) return new Date();
      const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      const [day, mon, yy] = str.split("-");
      const year = 2000 + parseInt(yy, 10);
      const month = months[mon];
      // Build the date using UTC components so it doesn't shift when
      // the driver stores it in UTC.
      return new Date(Date.UTC(year, month, parseInt(day, 10)));
    }

    const { receiptNo, transactionId } = await saveFeeEntry({
      idNo,
      collegeName: student.CollegeName,
      studentName: student.StudentName,
      fatherName: student.FatherName,
      course: student.Course,
      studentClass: student.Class,
      batch: student.Batch,
      classRollNo: student.ClassRollNo,
      uniRollNo: student.UniRollNo,
      semester: body.semester,
      scheme: student.Scheme,
      category: student.Category,
      modeOfAdmission: student.Quota,
      sex: student.Sex,
      onAccountOf: body.onAccountOf,
      totalCredit: body.totalCredit,
      modeOfPayment: body.modeOfPayment || "Cash",
      chequeDraftDate: body.chequeDraftDate || null,
      chequeDraftNo: body.chequeDraftNo || null,
      chequeDraftBank: body.chequeDraftBank || null,
      session: body.session || student.Session,
      userId: req.user?.id || body.userId || null,
      dateEntry: parseDDMonYY(body.dateEntry),
      feeHeads: body.feeHeads || [],
    });

    const ledger = await getLedger(idNo);

    let feeHeads = [];
    if (student.Scheme && student.Category && student.Quota) {
      feeHeads = await getFeeStructureWithBalances({
        idNo,
        collegeName: student.CollegeName,
        course: student.Course,
        batch: student.Batch,
        semester: body.semester,
        scheme: student.Scheme,
        category: student.Category,
        modeOfAdmission: student.Quota,
        session: body.session || student.Session,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Record has been Saved Successfully",
      receiptNo,
      transactionId,
      ledger,
      feeHeads,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAdmissionMetaOptions = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }

    const [schemes, categories, modesOfAdmission, currentSession] = await Promise.all([
      getSchemes(collegeName),
      getCategories(collegeName),
      getModesOfAdmission(),
      getCurrentMasterSession(),
    ]);

    return res.status(200).json({
      success: true,
      schemes,
      categories,
      modesOfAdmission,
      currentSession,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdmissionMeta = async (req, res) => {
  try {
    const { idNo } = req.params;
    const { scheme, category, quota, semester, session } = req.body;

    const student = await getStudentById(idNo);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await updateStudentAdmissionMeta(idNo, { scheme, category, quota });

    const updatedStudent = await getStudentById(idNo);
    const ledger = await getLedger(idNo);

    let feeHeads = [];
    if (semester && updatedStudent.Scheme && updatedStudent.Category && updatedStudent.Quota) {
      feeHeads = await getFeeStructureWithBalances({
        idNo,
        collegeName: updatedStudent.CollegeName,
        course: updatedStudent.Course,
        batch: updatedStudent.Batch,
        semester,
        scheme: updatedStudent.Scheme,
        category: updatedStudent.Category,
        modeOfAdmission: updatedStudent.Quota,
        session: session || updatedStudent.Session,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Update has been successfully completed",
      student: updatedStudent,
      ledger,
      feeHeads,
      scheme: updatedStudent.Scheme,
      category: updatedStudent.Category,
      quota: updatedStudent.Quota,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  findStudent,
  saveFee,
  getAdmissionMetaOptions,
  updateAdmissionMeta,
};