const { sql, withRetry } = require("../config/db");

async function getRouteStopageReport(collegeName) {
  return withRetry(async (pool) => {
    const request = pool.request();

    let where = `WHERE Facility = 'Bus'`;
    if (collegeName) {
      request.input("collegeName", sql.VarChar, collegeName);
      where += ` AND CollegeName = @collegeName`;
    }
    // NOTE: VB's "all colleges" branch actually restricts to a privileged-college list
    // (frmdebit.GetCollege()), not literally every college. This version has no such
    // restriction — flag if you need that scoping added back.

    const query = `
      SELECT RouteID, BusRoute, StopageID, Stopage, COUNT(IDNo) AS StudentCount
      FROM Admissions
      ${where}
      GROUP BY RouteID, BusRoute, StopageID, Stopage
      ORDER BY RouteID, StopageID
    `;

    const result = await request.query(query);
    return result.recordset;
  });
}

async function getCollegeAddress(collegeName) {
  return withRetry(async (pool) => {
    try {
      const result = await pool.request()
        .input("collegeName", sql.VarChar, collegeName)
        .query(`SELECT AddressLine1, AddressLine2 FROM Colleges WHERE Name = @collegeName`);
      const row = result.recordset[0];
      return { addressLine1: row?.AddressLine1 ?? "", addressLine2: row?.AddressLine2 ?? "" };
    } catch (err) {
      // Colleges table doesn't have address columns yet — see note in controller.
      console.warn("getCollegeAddress: address columns not found, returning blank.", err.message);
      return { addressLine1: "", addressLine2: "" };
    }
  });
}

module.exports = { getRouteStopageReport, getCollegeAddress };