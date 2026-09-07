const { sql, getPool } = require("../config/db");

/* ------------------------------------------------------------------ */
/*  Full record — mirrors frmUpdateEmployeeDetails.Display()           */
/* ------------------------------------------------------------------ */

const getEmployeeByIdNo = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo) // swap for sql.Int if Staff.IDNo isn't a bigint
    .query(`
      SELECT
        IDNo, CollegeName, Name, FatherName, MotherName, Gender,
        DateOfBirth, DateofJoining, DateofLeaving, Department, Designation,
        Qualification, CorrespondanceAddress, PermanentAddress, ContactNo,
        MobileNo, EmailID, SalaryAtJoining, SalaryAtPresent, PreviousExperience,
        BankName, BankAccountNo, PANNo, Snap
      FROM Staff
      WHERE IDNo = @IDNo
    `);

  return result.recordset[0] || null;
};

/* ------------------------------------------------------------------ */
/*  Update — mirrors btnUpdate_Click()                                  */
/*  (VB only ever UPDATEs; Snap and DateofLeaving are never written —   */
/*  Snap has no @Snap parameter in the legacy command, and every       */
/*  DateofLeaving line in btnUpdate_Click is commented out.)           */
/* ------------------------------------------------------------------ */

const updateEmployee = async (idNo, fields) => {
  const pool = await getPool();
  const request = pool.request();

  request
    .input("IDNo", sql.BigInt, idNo)
    .input("Name", sql.NVarChar, fields.Name || null)
    .input("FatherName", sql.NVarChar, fields.FatherName || null)
    .input("MotherName", sql.NVarChar, fields.MotherName || null)
    .input("Gender", sql.NVarChar, fields.Gender || null)
    .input("DateOfBirth", sql.DateTime, fields.DateOfBirth || null)
    .input("DateofJoining", sql.DateTime, fields.DateofJoining || null)
    .input("Department", sql.NVarChar, fields.Department || null)
    .input("Designation", sql.NVarChar, fields.Designation || null)
    .input("Qualification", sql.NVarChar, fields.Qualification || null)
    .input("CorrespondanceAddress", sql.NVarChar, fields.CorrespondanceAddress || null)
    .input("PermanentAddress", sql.NVarChar, fields.PermanentAddress || null)
    .input("ContactNo", sql.NVarChar, fields.ContactNo || null)
    .input("MobileNo", sql.NVarChar, fields.MobileNo || null)
    .input("EmailID", sql.NVarChar, fields.EmailID || null)
    .input("SalaryAtJoining", sql.Decimal(18, 2), fields.SalaryAtJoining || null)
    .input("SalaryAtPresent", sql.Decimal(18, 2), fields.SalaryAtPresent || null)
    .input("PreviousExperience", sql.NVarChar, fields.PreviousExperience || null)
    .input("BankName", sql.NVarChar, fields.BankName || null)
    .input("BankAccountNo", sql.NVarChar, fields.BankAccountNo || null)
    .input("PANNo", sql.NVarChar, fields.PANNo || null);

  const result = await request.query(`
    UPDATE Staff
    SET
      Name=@Name, FatherName=@FatherName, MotherName=@MotherName, Gender=@Gender,
      DateOfBirth=@DateOfBirth, DateofJoining=@DateofJoining, Department=@Department,
      Designation=@Designation, Qualification=@Qualification,
      CorrespondanceAddress=@CorrespondanceAddress, PermanentAddress=@PermanentAddress,
      ContactNo=@ContactNo, MobileNo=@MobileNo, EmailID=@EmailID,
      SalaryAtJoining=@SalaryAtJoining, SalaryAtPresent=@SalaryAtPresent,
      PreviousExperience=@PreviousExperience, BankName=@BankName,
      BankAccountNo=@BankAccountNo, PANNo=@PANNo
    WHERE IDNo=@IDNo
  `);

  return result.rowsAffected[0] > 0;
};

/* ------------------------------------------------------------------ */
/*  Bank master list — mirrors "Select Distinct BankName from          */
/*  MasterBank" and the AddBankName()/dlgBank "..." dialog             */
/* ------------------------------------------------------------------ */

const getBankNames = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT BankName FROM MasterBank ORDER BY BankName`);
  return result.recordset.map((r) => r.BankName);
};

const addBankName = async (bankName) => {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("BankName", sql.NVarChar, bankName)
    .query(`SELECT BankName FROM MasterBank WHERE BankName=@BankName`);

  if (existing.recordset[0]) {
    return existing.recordset[0].BankName;
  }

  await pool
    .request()
    .input("BankName", sql.NVarChar, bankName)
    .query(`INSERT INTO MasterBank (BankName) VALUES (@BankName)`);

  return bankName;
};

module.exports = {
  getEmployeeByIdNo,
  updateEmployee,
  getBankNames,
  addBankName,
};