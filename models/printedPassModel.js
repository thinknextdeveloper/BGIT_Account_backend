const { sql, getPool } = require("../config/db");
const { CURRENT_SESSION } = require("./studentModel");

// Mirrors checkentryalreadyexist(varCollegeName, varidno, srno)
async function checkEntryAlreadyExists(collegeName, idNo, session = CURRENT_SESSION) {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("IDNo", sql.VarChar, idNo);
  request.input("Session", sql.VarChar, session);
  const result = await request.query(`
    SELECT TOP (1) IDNo, SrNo
    FROM PrintedHostelBusPass
    WHERE CollegeName = @CollegeName AND IDNo = @IDNo AND Session = @Session
  `);
  return result.recordset[0] || null; // null => no existing entry
}

// Mirrors checkSerialNoHostelbuspass(varidno)
async function checkSerialNo(idNo, session = CURRENT_SESSION) {
  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.VarChar, idNo);
  request.input("Session", sql.VarChar, session);
  const result = await request.query(`
    SELECT SrNo, Session FROM PrintedHostelBusPass WHERE IDNo = @IDNo AND Session = @Session
  `);
  return result.recordset[0]?.SrNo ?? null; // null => "No" in the VB version
}

// Mirrors GetSerialNoHostelbuspass(varpasstype) -> Max(SrNo) + 1 for the session
async function getNextSerialNo(session = CURRENT_SESSION) {
  const pool = await getPool();
  const request = pool.request();
  request.input("Session", sql.VarChar, session);
  const result = await request.query(`
    SELECT MAX(SrNo) AS MaxSrNo FROM PrintedHostelBusPass WHERE Session = @Session
  `);
  const max = result.recordset[0]?.MaxSrNo;
  return max ? max + 1 : 1;
}

// Mirrors the "valid up to" branch of updateValidFor() — persisted onto
// Admissions/Registration directly (separate from the PrintedHostelBusPass row).
async function updateValidFor({ type, idNo, mode, validUpTo, validFor }) {
  const pool = await getPool();
  const request = pool.request();
  const table = type === "Registration" ? "Registration" : "Admissions";
  const keyCol = type === "Registration" ? "RegistrationNo" : "IDNo";

  request.input("IDNo", sql.VarChar, idNo);
  request.input("CardIssued", sql.VarChar, "Yes");
  request.input("CardIssuedDate", sql.DateTime, new Date());
  request.input("ValidUpTo", sql.VarChar, mode === "text" ? validFor : null);
  request.input("VALIDFOR", sql.VarChar, mode === "date" ? validUpTo : null);

  await request.query(`
    UPDATE ${table}
    SET CardIssued = @CardIssued, CardIssuedDate = @CardIssuedDate,
        ValidUpTo = @ValidUpTo, VALIDFOR = @VALIDFOR
    WHERE ${keyCol} = @IDNo
  `);
}

// Mirrors insertintoprinthostelbuspass(IDNo1, idno2) for a single student slot:
// updates the existing PrintedHostelBusPass row if one exists for this
// college/idNo/session, otherwise inserts a new one with the next serial number.
// `force` mirrors answering "Yes" to the "Entry already exists, duplicate?" prompt.
async function savePrintedPass({
  type,
  idNo,
  studentName,
  collegeName,
  course,
  batch,
  semester,
  fatherName,
  facility, // 'Bus' | 'Hostel'
  routeType, // 'Single Side' | 'Double Side'
  isFree,
  validMode, // 'date' | 'text'
  validUpTo,
  validFor,
  userName,
  force,
  session = CURRENT_SESSION,
}) {
  const passType = facility === "Bus" ? "BusPass" : facility === "Hostel" ? "HostelPass" : null;
  const existing = await checkEntryAlreadyExists(collegeName, idNo, session);

  if (existing && !force) {
    return { status: "DUPLICATE", srNo: existing.SrNo };
  }

  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.VarChar, idNo);
  request.input("StudentName", sql.VarChar, studentName);
  request.input("CollegeName", sql.VarChar, collegeName);
  request.input("Course", sql.VarChar, course);
  request.input("Batch", sql.VarChar, batch);
  request.input("Semester", sql.VarChar, semester);
  request.input("FatherName", sql.VarChar, fatherName);
  request.input("PrintDate", sql.DateTime, new Date());
  request.input("PassType", sql.VarChar, passType);
  request.input("ChargeType", sql.VarChar, isFree ? "Free" : null);
  request.input("RouteType", sql.VarChar, routeType || "Double Side");
  request.input("Validupto", sql.DateTime, validMode === "date" ? validUpTo : null);
  request.input("VALIDFOR", sql.VarChar, validMode === "text" ? validFor : null);
  request.input("UserName", sql.VarChar, userName || null);

  let srNo;
  if (existing) {
    srNo = existing.SrNo;
    request.input("SrNo", sql.Int, srNo);
    request.input("Session", sql.VarChar, session);
    await request.query(`
      UPDATE PrintedHostelBusPass
      SET RouteType = @RouteType, PrintDate = @PrintDate, ChargeType = @ChargeType,
          Validupto = @Validupto, VALIDFOR = @VALIDFOR, PassType = @PassType
      WHERE SrNo = @SrNo AND Session = @Session
    `);
  } else {
    srNo = await getNextSerialNo(session);
    request.input("SrNo", sql.Int, srNo);
    request.input("Session", sql.VarChar, session);
    await request.query(`
      INSERT INTO PrintedHostelBusPass
        (RouteType, PrintDate, ChargeType, SrNo, IDNo, StudentName, CollegeName,
         Course, Batch, Semester, FatherName, Validupto, VALIDFOR, UserName, PassType, Session)
      VALUES
        (@RouteType, @PrintDate, @ChargeType, @SrNo, @IDNo, @StudentName, @CollegeName,
         @Course, @Batch, @Semester, @FatherName, @Validupto, @VALIDFOR, @UserName, @PassType, @Session)
    `);
  }

  await updateValidFor({ type, idNo, mode: validMode, validUpTo, validFor });

  return { status: existing ? "UPDATED" : "CREATED", srNo };
}

// Mirrors "Update" function (btnUpdate1/2) — flips CardIssued on Admissions/Registration
// after confirming the operator answered the "already issued, reissue?" prompt.
async function issueCard({ type, idNo, validUpTo }) {
  const pool = await getPool();
  const table = type === "Registration" ? "Registration" : "Admissions";
  const keyCol = type === "Registration" ? "RegistrationNo" : "IDNo";

  const checkReq = pool.request();
  checkReq.input("IDNo", sql.VarChar, idNo);
  const existing = await checkReq.query(
    `SELECT CardIssued, CardIssuedDate FROM ${table} WHERE ${keyCol} = @IDNo`
  );
  if (existing.recordset.length === 0) {
    return { status: "NOT_FOUND" };
  }
  const row = existing.recordset[0];
  const alreadyIssued = row.CardIssued === "Yes";

  const updateReq = pool.request();
  updateReq.input("IDNo", sql.VarChar, idNo);
  updateReq.input("CardIssued", sql.VarChar, "Yes");
  updateReq.input("CardIssuedDate", sql.VarChar, new Date().toLocaleDateString("en-GB"));
  updateReq.input("ValidUpTo", sql.VarChar, validUpTo);
  await updateReq.query(`
    UPDATE ${table}
    SET CardIssued = @CardIssued, CardIssuedDate = @CardIssuedDate, ValidUpTo = @ValidUpTo
    WHERE ${keyCol} = @IDNo
  `);

  return { status: "OK", wasAlreadyIssued: alreadyIssued };
}

module.exports = {
  checkEntryAlreadyExists,
  checkSerialNo,
  getNextSerialNo,
  updateValidFor,
  savePrintedPass,
  issueCard,
};