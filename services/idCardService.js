const repo = require("../repositories/idCardRepository");

// Same college-access check as the rest of the app
// (frmdebit.EntryAlreadyExist(txtCollege.Text) in the legacy code).
let entryAlreadyExist;
try {
  ({ entryAlreadyExist } = require("../repositories/semesterRepository"));
} catch (e) {
  entryAlreadyExist = async () => true;
}

class AppError extends Error {
  constructor(message, status = 400, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// mirrors Display()
async function display({ type, idNo, userId }) {
  if (!idNo) throw new AppError("Please specify ID No.");

  const student = await repo.getStudent(type, idNo);
  if (!student) {
    throw new AppError(`${type === "Registration" ? "Registration" : "ID"} No. ${idNo} does not exist`, 404);
  }

  const hasAccess = await entryAlreadyExist(userId, student.CollegeName);
  if (!hasAccess) {
    throw new AppError("This ID No. does not belong to your rights", 403);
  }

  const semesters = await repo.getSemesters(type, idNo, student.Facility);
  const ledgerRows = await repo.getLedgerRows(type, idNo, student.CollegeName);

  return { student, semesters, ledgerRows };
}

// mirrors cmbSemester_SelectedIndexChanged
async function getValidUpTo({ college, batch, semester, facility }) {
  if (!["Bus", "Hostel"].includes(facility)) {
    throw new AppError("Facility must be Bus or Hostel to look up validity");
  }
  const validUpTo = await repo.getValidUpTo(college, batch, semester, facility);
  return { validUpTo };
}

// mirrors Update() + updateValidFor() — "Already card has been issued...
// Do you want to again issued a card?" prompt becomes a 409 the client can confirm past.
async function updateCard({ type, idNo, mode, validUpTo, validFor, force }) {
  const student = await repo.getStudent(type, idNo);
  if (!student) throw new AppError(`ID No. ${idNo} does not exist`, 404);

  if (student.CardIssued === "Yes" && !force) {
    throw new AppError(
      `Already card has been issued for ID No. ${idNo} on ${student.CardIssuedDate}. Do you want to again issue a card?`,
      409,
      "CARD_ALREADY_ISSUED"
    );
  }

  await repo.setCardIssued(type, idNo, {
    validUpTo: mode === "date" ? validUpTo : null,
    validFor: mode === "text" ? validFor : null,
  });

  return { message: `Card has been issued successfully for ${idNo}` };
}

// mirrors SaveImage() + SaveImagetoDataBase()
async function saveImage({ type, idNo, buffer }) {
  if (!idNo) throw new AppError("Please give ID No. to file");
  if (!buffer || !buffer.length) throw new AppError("No Image found to be saved");
  await repo.saveSnap(type, idNo, buffer);
  return { message: "Image saved successfully" };
}

// mirrors btnPrint_Click / btnPrintDirect_Click's Bus/Hostel fee checks
async function getPrintPayload({ type, idNo, facility }) {
  const student = await repo.getStudent(type, idNo);
  if (!student) throw new AppError(`ID No. ${idNo} does not exist`, 404);

  if (facility === "Bus" && !(student.BusFee > 0)) {
    throw new AppError(
      "Hostel/Bus Pass can not be printed. Please deposit required amount for Bus Facility",
      422
    );
  }
  if (facility === "Hostel" && !(student.HostelCharges > 0)) {
    throw new AppError(
      "Hostel/Bus Pass can not be printed. Please deposit required amount for Hostel Facility",
      422
    );
  }
  if (facility !== "Bus" && facility !== "Hostel") {
    throw new AppError("Bus and Hostel facilities are not found for this ID No.", 422);
  }

  const snap = await repo.getSnap(type, idNo);

  return {
    header: facility === "Hostel" ? "HOSTEL PASS" : "BUS PASS",
    label: facility === "Hostel" ? "Hostel Name :" : "Route :",
    student: {
      name: student.StudentName,
      fatherName: student.FatherName,
      college: student.CollegeName,
      course: student.Course,
      batch: student.Batch,
      rollNo: student.ClassRollNo,
      keyNo: student.KeyNo,
      address: student.PermanentAddress,
      routeOrHostel:
        facility === "Hostel"
          ? student.HostelName
          : student.RouteID
          ? `${student.RouteID}(College to ${student.BusRoute})`
          : student.BusRoute,
      stopage: student.Stopage,
      contactNo:
        student.FatherMobileNo || student.PhoneNo || student.MotherMobileNo || student.StudentMobileNo,
      validUpTo: student.ValidUpTo,
      validFor: student.ValidFor,
    },
    photoBase64: snap ? snap.toString("base64") : null,
  };
}

module.exports = { display, getValidUpTo, updateCard, saveImage, getPrintPayload, AppError };