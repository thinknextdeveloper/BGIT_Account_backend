const { sql, getPool } = require("../config/db");

/* ------------------------------------------------------------------ */
/*  Full record — mirrors frmUpdateStudentDetails.displayMethod()      */
/* ------------------------------------------------------------------ */

const getFullAdmissionByIdNo = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .query(`
      SELECT
        IDNo, CollegeName, Course, Class, Batch, ClassRollNo, UniRollNo,
        FirstPreference, SecondPreference, ThirdPreference, FourthPreference,
        StudentName, FatherName, MotherName, BloodGroup, PhoneNo,
        StudentMobileNo, FatherMobileNo, MotherMobileNo, EmailID,
        CorrespondanceAddress, PermanentAddress, FatherOccupation,
        FatherDesignation, MotherOccupation, Category, Locality, Sex,
        AdmissionDate, DOB, RouteID, StopageID, HostelName, RoomType,
        BusRoute, Stopage, HostelCharges, BusFee, Facility, StudentType,
        Concession, ConcessionDetails, ConcessionPerc, ConcessionTotalAmount,
        State, LateralEntry, Scheme, Quota, Religion, City,
        InstitutionLastAttended, BoardRegistrationNo, GroupName,
        EntranceTest1, EntranceTest2, EntranceTest1Rank, EntranceTest2Rank,
        EntranceTest1RollNo, EntranceTest2RollNo, Village, VPO, PO,
        Tehsil, District, ConcessionReferenceLetterNo, Snap
      FROM Admissions
      WHERE IDNo = @IDNo
    `);

  return result.recordset[0] || null;
};

/* ------------------------------------------------------------------ */
/*  Update — mirrors updateStudentAdmissions()                         */
/*  (VB only ever UPDATEs; the Admissions row is created elsewhere     */
/*  in the admission workflow, so this does not insert.)               */
/* ------------------------------------------------------------------ */

const updateAdmission = async (idNo, collegeName, fields) => {
  const pool = await getPool();
  const request = pool.request();

  request
    .input("IDNo", sql.BigInt, idNo)
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("Village", sql.NVarChar, fields.village || null)
    .input("VPO", sql.NVarChar, fields.vpo || null)
    .input("PO", sql.NVarChar, fields.po || null)
    .input("District", sql.NVarChar, fields.district || null)
    .input("Tehsil", sql.NVarChar, fields.tehsil || null)
    .input("ConcessionReferenceLetterNo", sql.NVarChar, fields.concessionReferenceLetterNo || null)
    .input("ClassRollNo", sql.NVarChar, fields.classRollNo || null)
    .input("Course", sql.NVarChar, fields.course || null)
    .input("Class", sql.NVarChar, fields.studentClass || null)
    .input("Batch", sql.Int, fields.batch || null)
    .input("FirstPreference", sql.NVarChar, fields.firstPreference || "None")
    .input("SecondPreference", sql.NVarChar, fields.secondPreference || "None")
    .input("ThirdPreference", sql.NVarChar, fields.thirdPreference || "None")
    .input("FourthPreference", sql.NVarChar, fields.fourthPreference || "None")
    .input("StudentName", sql.NVarChar, fields.studentName || null)
    .input("FatherName", sql.NVarChar, fields.fatherName || null)
    .input("MotherName", sql.NVarChar, fields.motherName || null)
    .input("BloodGroup", sql.NVarChar, fields.bloodGroup || "None")
    .input("PhoneNo", sql.NVarChar, fields.phoneNo || null)
    .input("StudentMobileNo", sql.NVarChar, fields.studentMobileNo || null)
    .input("FatherMobileNo", sql.NVarChar, fields.fatherMobileNo || null)
    .input("MotherMobileNo", sql.NVarChar, fields.motherMobileNo || null)
    .input("EmailID", sql.NVarChar, fields.emailId || null)
    .input("CorrespondanceAddress", sql.NVarChar, fields.correspondanceAddress || null)
    .input("PermanentAddress", sql.NVarChar, fields.permanentAddress || null)
    .input("FatherOccupation", sql.NVarChar, fields.fatherOccupation || null)
    .input("FatherDesignation", sql.NVarChar, fields.fatherDesignation || null)
    .input("MotherOccupation", sql.NVarChar, fields.motherOccupation || null)
    .input("Category", sql.NVarChar, fields.category || null)
    .input("Locality", sql.NVarChar, fields.locality || null)
    .input("Sex", sql.NVarChar, fields.sex || null)
    .input("AdmissionDate", sql.DateTime, fields.admissionDate || null)
    .input("DOB", sql.DateTime, fields.dob || null)
    .input("RouteID", sql.Int, fields.facility === "Bus" ? fields.routeId || null : null)
    .input("StopageID", sql.Int, fields.facility === "Bus" ? fields.stopageId || null : null)
    .input("HostelName", sql.NVarChar, fields.facility === "Hostel" ? fields.hostelName || null : null)
    .input("RoomType", sql.NVarChar, fields.facility === "Hostel" ? fields.roomType || null : null)
    .input("BusRoute", sql.NVarChar, fields.facility === "Bus" ? fields.busRoute || null : null)
    .input("Stopage", sql.NVarChar, fields.facility === "Bus" ? fields.stopage || null : null)
    .input("HostelCharges", sql.Decimal(18, 2), fields.facility === "Hostel" ? fields.hostelCharges || null : null)
    .input("BusFee", sql.Decimal(18, 2), fields.facility === "Bus" ? fields.busFee || null : null)
    .input("Facility", sql.NVarChar, fields.facility || "None")
    .input("StudentType", sql.NVarChar, fields.studentType || "New")
    .input("Concession", sql.NVarChar, fields.concession || null)
    .input("ConcessionDetails", sql.NVarChar, fields.concessionDetails || null)
    .input("ConcessionPerc", sql.Decimal(5, 2), fields.concessionPerc || null)
    .input("ConcessionTotalAmount", sql.Decimal(18, 2), fields.concessionTotalAmount || null)
    .input("State", sql.NVarChar, fields.state || null)
    .input("LateralEntry", sql.NVarChar, fields.lateralEntry ? "Yes" : "No")
    .input("Scheme", sql.NVarChar, fields.scheme || "None")
    .input("Quota", sql.NVarChar, fields.quota || null)
    .input("Religion", sql.NVarChar, fields.religion || null)
    .input("City", sql.NVarChar, fields.city || null)
    .input("InstitutionLastAttended", sql.NVarChar, fields.institutionLastAttended || null)
    .input("BoardRegistrationNo", sql.NVarChar, fields.boardRegistrationNo || null)
    .input("GroupName", sql.NVarChar, fields.groupName || null)
    .input("UniRollNo", sql.NVarChar, fields.uniRollNo || null)
    .input("EntranceTest1", sql.NVarChar, fields.entranceTest1 || null)
    .input("EntranceTest2", sql.NVarChar, fields.entranceTest2 || null)
    .input("EntranceTest1Rank", sql.NVarChar, fields.entranceTest1Rank || null)
    .input("EntranceTest2Rank", sql.NVarChar, fields.entranceTest2Rank || null)
    .input("EntranceTest1RollNo", sql.NVarChar, fields.entranceTest1RollNo || null)
    .input("EntranceTest2RollNo", sql.NVarChar, fields.entranceTest2RollNo || null);

  const result = await request.query(`
    UPDATE Admissions
    SET
      Village=@Village, VPO=@VPO, PO=@PO, District=@District, Tehsil=@Tehsil,
      ConcessionReferenceLetterNo=@ConcessionReferenceLetterNo,
      ClassRollNo=@ClassRollNo, Course=@Course, Class=@Class, Batch=@Batch,
      FirstPreference=@FirstPreference, SecondPreference=@SecondPreference,
      ThirdPreference=@ThirdPreference, FourthPreference=@FourthPreference,
      StudentName=@StudentName, FatherName=@FatherName, MotherName=@MotherName,
      BloodGroup=@BloodGroup, PhoneNo=@PhoneNo, StudentMobileNo=@StudentMobileNo,
      FatherMobileNo=@FatherMobileNo, MotherMobileNo=@MotherMobileNo,
      EmailID=@EmailID, CorrespondanceAddress=@CorrespondanceAddress,
      PermanentAddress=@PermanentAddress, FatherOccupation=@FatherOccupation,
      FatherDesignation=@FatherDesignation, MotherOccupation=@MotherOccupation,
      Category=@Category, Locality=@Locality, Sex=@Sex,
      AdmissionDate=@AdmissionDate, DOB=@DOB, RouteID=@RouteID,
      StopageID=@StopageID, HostelName=@HostelName, RoomType=@RoomType,
      BusRoute=@BusRoute, Stopage=@Stopage, HostelCharges=@HostelCharges,
      BusFee=@BusFee, Facility=@Facility, StudentType=@StudentType,
      Concession=@Concession, ConcessionDetails=@ConcessionDetails,
      ConcessionPerc=@ConcessionPerc, ConcessionTotalAmount=@ConcessionTotalAmount,
      State=@State, LateralEntry=@LateralEntry, Scheme=@Scheme, Quota=@Quota,
      Religion=@Religion, City=@City,
      InstitutionLastAttended=@InstitutionLastAttended,
      BoardRegistrationNo=@BoardRegistrationNo, GroupName=@GroupName,
      UniRollNo=@UniRollNo, EntranceTest1=@EntranceTest1, EntranceTest2=@EntranceTest2,
      EntranceTest1Rank=@EntranceTest1Rank, EntranceTest2Rank=@EntranceTest2Rank,
      EntranceTest1RollNo=@EntranceTest1RollNo, EntranceTest2RollNo=@EntranceTest2RollNo
    WHERE IDNo=@IDNo AND CollegeName=@CollegeName
  `);

  return result.rowsAffected[0] > 0;
};

/* ------------------------------------------------------------------ */
/*  Master / dropdown data — mirrors the VB combobox-populating subs   */
/* ------------------------------------------------------------------ */

const getColleges = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT CollegeName FROM Admissions WHERE CollegeName IS NOT NULL ORDER BY CollegeName`);
  return result.recordset.map((r) => r.CollegeName);
};

// Mirrors ShowCategory()
const getCategoryMasterList = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT Category FROM MasterCategory ORDER BY Category ASC`);
  return result.recordset.map((r) => r.Category);
};

// Mirrors ShowVillage()
const getVillages = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT Village FROM MasterVillage`);
  return result.recordset.map((r) => r.Village);
};

// Mirrors showDistrict()
const getDistricts = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT District FROM MasterDistrict ORDER BY District`);
  return result.recordset.map((r) => r.District);
};

// Mirrors showTehsil()
const getTehsils = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT Tehsil FROM MasterTehsil ORDER BY Tehsil`);
  return result.recordset.map((r) => r.Tehsil);
};

// Mirrors frmdebit.ShowGroupName(collegeName, cmb)
const getGroupNames = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT GroupName FROM MasterGroupName WHERE CollegeName=@CollegeName ORDER BY GroupName`);
  return result.recordset.map((r) => r.GroupName);
};

// Mirrors concessiondetails()
const getConcessionDetailsList = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT ConcessionDetails FROM MasterConcession WHERE CollegeName=@CollegeName`);
  return result.recordset.map((r) => r.ConcessionDetails);
};

// Mirrors cmbConcessionDetail_SelectedIndexChanged
const getConcessionLookup = async (collegeName, concessionDetails) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("ConcessionDetails", sql.NVarChar, concessionDetails)
    .query(`
      SELECT ConcessionPerc, ConcessionAmount
      FROM MasterConcession
      WHERE ConcessionDetails=@ConcessionDetails AND CollegeName=@CollegeName
    `);
  return result.recordset[0] || { ConcessionPerc: null, ConcessionAmount: null };
};

// Mirrors rdbtnhostel_CheckedChanged's hostel-name query
const getHostelNames = async (collegeName, batch) => {
  const pool = await getPool();
  const request = pool.request().input("CollegeName", sql.NVarChar, collegeName);
  let query = `SELECT DISTINCT HostelName FROM MasterHostelCharges WHERE CollegeName=@CollegeName`;
  if (batch) {
    request.input("Batch", sql.Int, batch);
    query += ` AND Batch=@Batch`;
  }
  const result = await request.query(query);
  return result.recordset.map((r) => r.HostelName);
};

// Mirrors cmbhostelbusroute_SelectedIndexChanged (hostel branch)
const getRoomTypes = async (collegeName, batch, hostelName) => {
  const pool = await getPool();
  const request = pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("HostelName", sql.NVarChar, hostelName);
  let query = `SELECT DISTINCT RoomType FROM MasterHostelCharges WHERE HostelName=@HostelName AND CollegeName=@CollegeName`;
  if (batch) {
    request.input("Batch", sql.Int, batch);
    query += ` AND Batch=@Batch`;
  }
  const result = await request.query(query);
  return result.recordset.map((r) => r.RoomType);
};

// Mirrors cmbroomtypestopage_SelectedIndexChanged (hostel branch)
const getHostelFee = async (collegeName, batch, hostelName, roomType) => {
  const pool = await getPool();
  const request = pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("HostelName", sql.NVarChar, hostelName)
    .input("RoomType", sql.NVarChar, roomType);
  let query = `
    SELECT HostelFee FROM MasterHostelCharges
    WHERE HostelName=@HostelName AND RoomType=@RoomType AND CollegeName=@CollegeName
  `;
  if (batch) {
    request.input("Batch", sql.Int, batch);
    query += ` AND Batch=@Batch`;
  }
  const result = await request.query(query);
  return result.recordset[0]?.HostelFee ?? null;
};

// Mirrors rdbtnBus_CheckedChanged
const getBusRoutes = async (session) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Session", sql.NVarChar, session)
    .query(`SELECT DISTINCT Route FROM MasterBusFee WHERE Session=@Session`);
  return result.recordset.map((r) => r.Route);
};

// Mirrors cmbhostelbusroute_SelectedIndexChanged (bus branch)
const getStopages = async (session, route) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Session", sql.NVarChar, session)
    .input("Route", sql.NVarChar, route)
    .query(`SELECT DISTINCT Stopage FROM MasterBusFee WHERE Route=@Route AND Session=@Session`);
  return result.recordset.map((r) => r.Stopage);
};

// Mirrors cmbroomtypestopage_SelectedIndexChanged (bus branch)
const getBusFee = async (session, route, stopage) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Session", sql.NVarChar, session)
    .input("Route", sql.NVarChar, route)
    .input("Stopage", sql.NVarChar, stopage)
    .query(`SELECT Fee FROM MasterBusFee WHERE Route=@Route AND Stopage=@Stopage AND Session=@Session`);
  return result.recordset[0]?.Fee ?? null;
};

module.exports = {
  getFullAdmissionByIdNo,
  updateAdmission,
  getColleges,
  getCategoryMasterList,
  getVillages,
  getDistricts,
  getTehsils,
  getGroupNames,
  getConcessionDetailsList,
  getConcessionLookup,
  getHostelNames,
  getRoomTypes,
  getHostelFee,
  getBusRoutes,
  getStopages,
  getBusFee,
};