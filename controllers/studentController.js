const studentModel = require("../models/studentModel");
const lookupModel = require("../models/lookupModel");
const passModel = require("../models/printedPassModel");

// Mirrors btnDisplay_Click -> Display1(txtIDNo.Text) / Display2(txtidno1.Text)
const display = async (req, res) => {
  try {
    const { type, idNo } = req.query; // type: 'IDNo' | 'Registration'

    if (!idNo) {
      return res.status(400).json({ success: false, message: "Enter ID/Registration No." });
    }
    const expectedLen = type === "Registration" ? 6 : 10;
    if (idNo.length !== expectedLen) {
      return res.status(400).json({
        success: false,
        message: type === "Registration" ? "Invalid Registration No." : "Invalid ID No.",
      });
    }

    const { found, noFacility, student } = await studentModel.getStudent(type, idNo);
    if (!found) {
      return res.status(404).json({ success: false, message: "ID No does not exists" });
    }
    if (noFacility) {
      return res.status(200).json({
        success: false,
        message: `No Faculity Available for this IDNo.${idNo}`,
      });
    }

    const subhead = student.Facility === "Bus" ? "Transport Charges" : "Hostel Charges";

    const { semesters, selectedSemester } = await lookupModel.getStudentSemesters({
      collegeName: student.CollegeName,
      course: student.Course,
      batch: student.Batch,
      idNo,
      session: studentModel.CURRENT_SESSION,
    });

    // chkFree logic: if a Transport/Hostel Charges payment already exists,
    // "Free Pass" is disabled and force-unchecked; otherwise it's available.
    const hasPaid = await studentModel.hasFeePayment({
      idNo,
      collegeName: student.CollegeName,
      subhead,
    });

    let feeRows = [];
    let canPrint = hasPaid; // if already free-pass-eligible, no fee row needed
    if (!hasPaid && selectedSemester) {
      feeRows = await studentModel.getFeeRows({
        idNo,
        collegeName: student.CollegeName,
        semester: selectedSemester,
        subhead,
      });
      canPrint = feeRows.length > 0;
    }

    const existingSrNo = await passModel.checkSerialNo(idNo, studentModel.CURRENT_SESSION);

    return res.status(200).json({
      success: true,
      data: {
        student,
        semesters,
        selectedSemester,
        freePassAvailable: !hasPaid,
        canPrint,
        feeRows,
        blockedMessage: canPrint
          ? null
          : `Hostel/Bus Pass can not be printed. Please deposit required amount for ${student.Facility} Facility`,
        srNo: existingSrNo,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { display };