const { sql, getPool } = require("../config/db");

async function getHostelNames() {
  const pool = await getPool();
  const result = await pool.request()
    .query(`SELECT DISTINCT HostelName FROM MasterHostelCharges WHERE HostelName IS NOT NULL ORDER BY HostelName`);
  return result.recordset.map((r) => r.HostelName);
}

async function getHostelFacilityReport({ collegeName, allColleges, hostelName }) {
  const pool = await getPool();
  const request = pool.request();

  let where = `WHERE Facility = 'Hostel'`;

  if (!allColleges) {
    request.input("collegeName", sql.VarChar, collegeName);
    where += ` AND CollegeName = @collegeName`;
  }
  if (hostelName) {
    request.input("hostelName", sql.VarChar, hostelName);
    where += ` AND HostelName = @hostelName`;
  }

  const query = `
    SELECT IDNo, StudentName, FatherName, PhoneNo, StudentMobileNo, FatherMobileNo,
           PermanentAddress, HostelName, RoomType, HostelCharges
    FROM Admissions
    ${where}
  `;

  const result = await request.query(query);
  return result.recordset;
}

module.exports = { getHostelNames, getHostelFacilityReport };