const { sql, getPool } = require("../config/db");

/**
 * @param {{address:string, collegeName?:string, allColleges:boolean, userColleges:string[]}} params
 * userColleges is the logged-in user's privileged college list — mirrors
 * frmdebit.GetCollege(), which fed a preformatted IN-list into the SQL
 * string directly. Passed here as a real array and parameterized instead.
 */
async function searchStudentsByAddress({ address, collegeName, allColleges, userColleges }) {
  const pool = await getPool();
  const request = pool.request().input("address", sql.VarChar, `%${address}%`);

  let where = `WHERE PermanentAddress LIKE @address`;

  if (allColleges) {
    if (Array.isArray(userColleges) && userColleges.length > 0) {
      const params = userColleges.map((name, i) => {
        const p = `college${i}`;
        request.input(p, sql.VarChar, name);
        return `@${p}`;
      });
      where += ` AND CollegeName IN (${params.join(", ")})`;
    }
    // If userColleges is empty, no college restriction is applied — matches
    // the VB.NET behavior when GetCollege() returns an empty list (the
    // "In()" clause would be malformed there anyway).
  } else {
    request.input("college", sql.VarChar, collegeName);
    where += ` AND CollegeName = @college`;
  }

  const query = `
    SELECT IDNo, StudentName, Class, FatherName, PhoneNo, StudentMobileNo,
           FatherMobileNo, MotherMobileNo, PermanentAddress
    FROM Admissions
    ${where}
  `;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchStudentsByAddress };