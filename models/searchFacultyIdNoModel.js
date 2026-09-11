const { sql, getPool } = require("../config/db");

/**
 * Searches faculty/staff by IDNo from Staff table.
 * @param {{idNo: string|number, collegeName?: string, allColleges: boolean, userColleges?: string[]}} params
 */
async function searchFacultyByIDNo({ idNo, collegeName, allColleges, userColleges }) {
  console.log("🔍 [Backend SearchFacultyByIDNo] Params received:", {
    idNo,
    collegeName,
    allColleges,
    userColleges,
  });

  const pool = await getPool();
  const request = pool.request().input("idNo", sql.VarChar, String(idNo).trim());

  let where = `WHERE IDNo = @idNo`;

  if (!allColleges && collegeName) {
    request.input("college", sql.VarChar, collegeName);
    where += ` AND CollegeName = @college`;
  } else if (allColleges) {
    if (Array.isArray(userColleges) && userColleges.length > 0) {
      const params = userColleges.map((name, i) => {
        const p = `college${i}`;
        request.input(p, sql.VarChar, name);
        return `@${p}`;
      });
      where += ` AND CollegeName IN (${params.join(", ")})`;
    } else {
      // Mirrors VB objcollege = frmdebit.GetCollege() (valid colleges from MasterCourses)
      where += ` AND CollegeName IN (SELECT DISTINCT CollegeName FROM MasterCourses WHERE CollegeName IS NOT NULL)`;
    }
  }

  const query = `
    SELECT
      CollegeName,
      IDNo,
      CardID,
      Name,
      FatherName,
      MotherName,
      Designation,
      Department,
      Type,
      ShiftName,
      Gender,
      CorrespondanceAddress,
      PermanentAddress,
      ContactNo,
      MobileNo,
      EmailID,
      DateOfBirth,
      BloodGroup,
      DateOfJoining,
      SalaryAtJoining,
      SalaryAtPresent,
      Qualification,
      PreviousExperience,
      BankName,
      BankAccountNo,
      PANNo,
      Snap,
      Locked,
      DateOfLeaving,
      PF,
      Security,
      Advance,
      TDS,
      EmpCode,
      TotalLeaves,
      Level,
      DesignationLevel,
      AddressLine1,
      AddressLine2,
      AddressLine3,
      SmartCardAccess,
      DepartmentID,
      Pre_Year_Perforn,
      Pre_Year_Threats_Opp,
      OtherWork,
      OtherAchievement,
      Suggestion
    FROM Staff
    ${where}
    ORDER BY IDNo, Name
  `;

  console.log("📝 [Backend SearchFacultyByIDNo] Executing SQL Query:\n", query);

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchFacultyByIDNo };
