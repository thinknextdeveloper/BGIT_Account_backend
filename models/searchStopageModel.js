const { sql, getPool } = require("../config/db");

/**
 * Searches Stopages from MasterBusFee table.
 * @param {{stopage: string, userColleges?: string[]}} params
 */
async function searchStopage({ stopage, userColleges }) {
  console.log("🔍 [Backend SearchStopage] Params received:", {
    stopage,
    userColleges,
  });

  const pool = await getPool();
  const request = pool.request().input("stopage", sql.VarChar, `%${stopage.trim()}%`);

  let collegeFilter = `CollegeName IN (SELECT DISTINCT CollegeName FROM MasterCourses WHERE CollegeName IS NOT NULL)`;

  if (Array.isArray(userColleges) && userColleges.length > 0) {
    const params = userColleges.map((name, i) => {
      const p = `college${i}`;
      request.input(p, sql.VarChar, name);
      return `@${p}`;
    });
    collegeFilter = `CollegeName IN (${params.join(", ")})`;
  }

  const query = `
    SELECT
      Stopage,
      Route,
      Fee
    FROM MasterBusFee
    WHERE ${collegeFilter}
      AND Stopage LIKE @stopage
    ORDER BY Stopage, Route
  `;

  console.log("📝 [Backend SearchStopage] Executing SQL Query:\n", query);

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { searchStopage };
