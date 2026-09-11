const { sql, getPool } = require("../config/db");

/**
 * Searches admissions by StudentName.
 * @param {{studentName: string, collegeName?: string, allColleges: boolean, searchType?: 'part'|'exact', userColleges?: string[]}} params
 */
async function searchStudentsByName({ studentName, collegeName, allColleges, searchType = "part", userColleges }) {
  const pool = await getPool();
  const request = pool.request();

  let nameCondition = "";
  if (searchType === "exact") {
    request.input("studentName", sql.VarChar, studentName.trim());
    nameCondition = "WHERE StudentName = @studentName";
  } else {
    request.input("studentName", sql.VarChar, `%${studentName.trim()}%`);
    nameCondition = "WHERE (StudentName LIKE @studentName)";
  }

  let where = nameCondition;

  if (allColleges) {
    if (Array.isArray(userColleges) && userColleges.length > 0) {
      const params = userColleges.map((name, i) => {
        const p = `college${i}`;
        request.input(p, sql.VarChar, name);
        return `@${p}`;
      });
      where += ` AND CollegeName IN (${params.join(", ")})`;
    } else {
      where += ` AND CollegeName IN (SELECT DISTINCT CollegeName FROM MasterCourses WHERE CollegeName IS NOT NULL)`;
    }
  } else if (collegeName) {
    request.input("college", sql.VarChar, collegeName);
    where += ` AND CollegeName = @college`;
  }

  const query = `
    SELECT CollegeName, StudentName, IDNo, Class, FatherName, PhoneNo, StudentMobileNo,
           FatherMobileNo, MotherMobileNo, PermanentAddress
    FROM Admissions
    ${where}
    ORDER BY StudentName ASC, IDNo ASC
  `;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchStudentsByName };
