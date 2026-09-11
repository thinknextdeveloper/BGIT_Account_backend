const { sql, getPool } = require("../config/db");

/**
 * Searches admissions by ClassRollNo.
 * @param {{classRollNo: string|number, collegeName?: string, allColleges: boolean, userColleges?: string[]}} params
 */
async function searchStudentsByClassRollNo({ classRollNo, collegeName, allColleges, userColleges }) {
  const pool = await getPool();
  const request = pool.request();

  request.input("classRollNo", sql.VarChar, String(classRollNo).trim());
  let where = "WHERE LTRIM(RTRIM(CAST(ClassRollNo AS VARCHAR(100)))) = @classRollNo";

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
    SELECT *
    FROM Admissions
    ${where}
    ORDER BY IDNo ASC
  `;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchStudentsByClassRollNo };
