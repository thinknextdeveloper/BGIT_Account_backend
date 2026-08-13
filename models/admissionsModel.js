
const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE || "DBSmartCampusBGIET";
const DISPLAY_COLUMNS = [
  "CollegeName", "Course", "Batch", "Class", "LateralEntry", "AdmissionDate",
  "IDNo", "ClassRollNo", "StudentName", "FatherName", "MotherName", "Sex", "DOB",
  "FatherOccupation", "MotherOccupation", "FatherDesignation", "CorrespondanceAddress",
  "PermanentAddress", "EmailID", "PhoneNo", "StudentMobileNo", "FatherMobileNo",
  "MotherMobileNo", "Facility", "BusRoute", "RouteID", "Stopage", "StopageID",
  "HostelName", "RoomType", "HostelCharges", "BusFee", "StudentType", "Concession",
  "ConcessionDetails", "ConcessionPerc", "ConcessionTotalAmount", "BloodGroup",
  "Category", "Locality", "Medium", "Quota", "FeeWaiverScheme", "FirstPreference",
  "SecondPreference", "ThirdPreference", "FourthPreference", "Scheme",
  "InstitutionLastAttended", "University", "BoardRegistrationNo", "State", "Religion",
  "SeatConfirmed", "City", "GroupName", "UniRollNo", "ConcessionReferenceLetterNo",
  "Village", "VPO", "PO", "Tehsil", "District", "GuardianAddress", "GuardianContactNo",
  "Nationality", "PreviousMedicalIllness", "OtherEntranceTest", "NSS", "Sports",
  "OtherAchievements", "UserID", "EnquiryNo", "EnquiryDate", "RegistrationNo",
  "RegistrationDate", "CardIssued", "CardIssuedDate", "ValidUpTo", "LastExam", "Board",
  "LastExamPerc", "Newspaper", "ThirdPerson", "CableTV", "Student", "StaffMember",
  "FlexBoard", "Pamphlet", "Comments", "ThirdPersonName", "ThirdPersonDesignation",
  "ThirdPersonAddress", "ThirdPersonContactNo", "CableTVChannel", "ReferenceStudentClass",
  "StaffMemberName", "StaffMemberDesignation", "NewspaperName", "CommentsDetail",
  "Locked", "SmartCardIssued", "SmartCardIssuedDate", "EntranceTest1",
  "EntranceTest1RollNo", "EntranceTest1Rank", "EntranceTest2", "EntranceTest2RollNo",
  "EntranceTest2Rank",
];

const getStudents = async (collegeName, course, batch) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  const selectList = DISPLAY_COLUMNS.map((c) => `[${c}]`).join(", ");

  let query = `
    SELECT ${selectList}
    FROM [${dbName}].[dbo].[Admissions]
    WHERE [CollegeName] = @CollegeName
  `;

  if (course) {
    query += ` AND [Course] = @Course`;
    request.input("Course", sql.VarChar(200), course);
  }
  if (batch) {
    query += ` AND [Batch] = @Batch`;
    request.input("Batch", sql.Int, batch);
  }

  query += ` ORDER BY [IDNo]`;

  const result = await request.query(query);
  return result.recordset;
};

const ALLOWED_UPDATE_FIELDS = ["Sex", "Category", "Scheme"];

const updateField = async (idNo, field, value) => {
  if (!ALLOWED_UPDATE_FIELDS.includes(field)) {
    throw new Error(`Field '${field}' is not allowed to be updated this way.`);
  }

  const pool = await getPool();
  const request = pool.request();
  request.input("IDNo", sql.BigInt, idNo);
  request.input("Value", sql.VarChar(100), value);

  await request.query(`
    UPDATE [${dbName}].[dbo].[Admissions]
    SET [${field}] = @Value
    WHERE [IDNo] = @IDNo
  `);

  return { idNo, field, value };
};

module.exports = {
  getStudents,
  updateField,
};

