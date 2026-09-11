const { sql, getPool } = require("../config/db");

/**
 * Searches faculty/staff by Name from Staff table.
 * @param {{facultyName: string, collegeName?: string, allColleges: boolean, userColleges?: string[]}} params
 */
async function searchFacultyByName({ facultyName, collegeName, allColleges, userColleges }) {
  console.log(" [Backend SearchFaculty] Params received:", {
    facultyName,
    collegeName,
    allColleges,
    userColleges,
  });

  const pool = await getPool();
  const request = pool.request().input("name", sql.VarChar, `%${facultyName.trim()}%`);

  let where = `WHERE Name LIKE @name`;

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
    ORDER BY IDNo, Name, Department
  `;

  console.log(" [Backend SearchFaculty] Executing SQL Query:\n", query);

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchFacultyByName };
