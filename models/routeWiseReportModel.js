const { sql, withRetry } = require("../config/db");

/**
 * Total distinct stopages for a route.
 * Deliberately NOT filtered by CollegeName or Session — this matches the
 * original VB.NET `sql1` query:
 *   Select Distinct Stopage from Admissions where Facility='Bus' and BusRoute='<route>'
 * (the college filter is commented out in the VB.NET source for this query).
 */
async function getStopageCount(pool, route) {
  const result = await pool.request()
    .input("route", sql.VarChar, route)
    .query(`SELECT DISTINCT Stopage FROM Admissions WHERE Facility = 'Bus' AND BusRoute = @route`);
  return result.recordset.length;
}

async function getRoutes() {
  return withRetry(async (pool) => {
    const result = await pool.request()
      .query(`SELECT DISTINCT RouteID, Route FROM MasterBusFee WHERE Route IS NOT NULL`);
    return result.recordset.map((r) => ({ routeId: r.RouteID, route: r.Route }));
  });
}

/**
 * @param {string} route
 * @param {string[]} collegeNames - colleges to filter by (Admissions.CollegeName IN (...)).
 *   Mirrors `frmdebit.GetCollege()` in the VB.NET original, which fed a raw,
 *   unparameterized IN-list into the SQL string. Here it's passed as a real
 *   parameterized list instead, to avoid the same SQL-injection risk.
 * @param {string} [session] - defaults to "2018-19" because the VB.NET form
 *   hardcodes `Session='2018-19'` and has no session picker in its UI at all.
 *   That's very likely a leftover from whichever year the form was last
 *   touched rather than an intentional business rule — worth confirming
 *   with whoever owns this report, and wiring up a real session selector
 *   instead of a hardcoded default once you know the intended behavior.
 */
async function getRouteWiseReport(route, collegeNames, session = "2018-19") {
  return withRetry(async (pool) => {
    const totalStopages = await getStopageCount(pool, route);

    const detailReq = pool.request()
      .input("route", sql.VarChar, route)
      .input("session", sql.VarChar, session);

    let where = `WHERE Facility = 'Bus' AND BusRoute = @route AND Session = @session`;

    if (Array.isArray(collegeNames) && collegeNames.length > 0) {
      const collegeParams = collegeNames.map((name, i) => {
        const paramName = `college${i}`;
        detailReq.input(paramName, sql.VarChar, name);
        return `@${paramName}`;
      });
      where += ` AND CollegeName IN (${collegeParams.join(", ")})`;
    }

    const query = `
      SELECT Session, IDNo, StudentName, FatherName, PhoneNo, StudentMobileNo,
             FatherMobileNo, PermanentAddress, StopageID, Stopage
      FROM Admissions
      ${where}
      ORDER BY StopageID
    `;

    const result = await detailReq.query(query);
    const flatRows = result.recordset;

    // Group by StopageID/Stopage to match the Crystal Report's grouped layout
    const groupsMap = new Map();
    for (const row of flatRows) {
      const key = `${row.StopageID}-${row.Stopage}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { stopageId: row.StopageID, stopage: row.Stopage, students: [] });
      }
      groupsMap.get(key).students.push(row);
    }
    const groups = Array.from(groupsMap.values()).sort((a, b) => a.stopageId - b.stopageId);

    return {
      groups,
      totalStudents: flatRows.length,
      totalStopages,
    };
  });
}

module.exports = { getRoutes, getRouteWiseReport };