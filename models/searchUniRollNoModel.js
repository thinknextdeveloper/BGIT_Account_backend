const { sql, getPool } = require("../config/db");

/**
 * Searches admissions by UniRollNo.
 * @param {{uniRollNo: string, collegeName?: string, allColleges: boolean, userColleges?: string[]}} params
 */
async function searchStudentsByUniRollNo({ uniRollNo, collegeName, allColleges, userColleges }) {
  const pool = await getPool();
  const request = pool.request();

  request.input("uniRollNo", sql.VarChar, String(uniRollNo).trim());
  let where = "WHERE LTRIM(RTRIM(CAST(UniRollNo AS VARCHAR(100)))) = @uniRollNo";

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

module.exports = { searchStudentsByUniRollNo };
