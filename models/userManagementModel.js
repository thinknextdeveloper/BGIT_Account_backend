const { sql, withRetry } = require("../config/db");
const crypto = require("crypto");

function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

// TODO: mirrors frmdebit.GetAssignedCollegeName1() — the comma-separated
// list of colleges the logged-in user is scoped to. Needs req.user/session
// wiring; currently returns "no restriction" (all colleges).
async function getAssignedColleges(/* userId */) {
  return null; // null = no restriction, handled by callers below
}

async function getLoginTypes() {
  return withRetry(async (pool) => {
    const result = await pool.request().query(
      `SELECT DISTINCT LoginType FROM MasterLoginType
       WHERE LoginType NOT IN ('Student', 'Parents')
       ORDER BY LoginType`
    );
    return result.recordset.map((r) => r.LoginType).filter(Boolean);
  });
}

// Mirrors: PersonalDetail() first query (shared with frmAssignRights)
async function getStaffByIdNo(idNo) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("idNo", sql.VarChar, cleanParam(idNo))
      .query(
        `SELECT CollegeName, IDNo, Name, FatherName, Department, Designation,
                CASE WHEN Snap IS NULL THEN 0 ELSE 1 END AS HasSnap
         FROM Staff
         WHERE IDNo = @idNo
         ORDER BY IDNo`
      );
    return result.recordset[0] || null;
  });
}

async function getStaffSnap(idNo) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("idNo", sql.VarChar, cleanParam(idNo))
      .query(`SELECT Snap FROM Staff WHERE IDNo = @idNo`);
    const row = result.recordset[0];
    return row && row.Snap ? row.Snap : null;
  });
}

// Mirrors: DisplayAllcolleges() —
// select distinct CollegeName from MasterCourse where CollegeName IN(assigned) order by CollegeName
async function getAllColleges(assignedColleges) {
  return withRetry(async (pool) => {
    const request = pool.request();
    let where = "";
    if (assignedColleges && assignedColleges.length > 0) {
      const params = assignedColleges.map((c, i) => {
        request.input(`college${i}`, sql.VarChar, c);
        return `@college${i}`;
      });
      where = `WHERE CollegeName IN (${params.join(", ")})`;
    }
    const result = await request.query(
      `SELECT DISTINCT CollegeName FROM MasterCourse ${where} ORDER BY CollegeName`
    );
    return result.recordset.map((r) => r.CollegeName);
  });
}

// Mirrors: ShowUserDetail() —
// select UserName,Password,LoginType,ApplicationType,ApplicationName,CollegeName
// from UserMaster where UserName=... and ApplicationType='Windows' and
// ApplicationName='Accounts' and CollegeName IN(assigned)
async function getUserRecords(idNo, assignedColleges) {
  return withRetry(async (pool) => {
    const request = pool.request().input("idNo", sql.VarChar, cleanParam(idNo));
    let where = `WHERE UserName = @idNo AND ApplicationType = 'Windows' AND ApplicationName = 'Accounts'`;
    if (assignedColleges && assignedColleges.length > 0) {
      const params = assignedColleges.map((c, i) => {
        request.input(`college${i}`, sql.VarChar, c);
        return `@college${i}`;
      });
      where += ` AND CollegeName IN (${params.join(", ")})`;
    }
    const result = await request.query(
      `SELECT UserName, Password, LoginType, ApplicationType, ApplicationName, CollegeName
       FROM UserMaster
       ${where}`
    );
    return result.recordset;
  });
}

// Mirrors: GetRandomPasswordUsingGUID(8)
function generateRandomPassword(length = 8) {
  const guid = crypto.randomUUID().replace(/-/g, "");
  return guid.substring(0, length);
}

// Mirrors: btnGeneratePassword_Click —
// one password generated up front, inserted for each checked college that
// doesn't already have one for this (UserName, LoginType). Stops and
// reports the first college that already has a password, same as the
// original's early-exit MsgBox.
async function generatePasswordForColleges(idNo, loginType, colleges) {
  return withRetry(async (pool) => {
    const varPassword = generateRandomPassword(8);

    for (const college of colleges) {
      const existing = await pool
        .request()
        .input("idNo", sql.VarChar, cleanParam(idNo))
        .input("college", sql.VarChar, college)
        .input("loginType", sql.VarChar, cleanParam(loginType))
        .query(
          `SELECT Password FROM UserMaster
           WHERE UserName = @idNo AND CollegeName = @college
             AND LoginType = @loginType AND ApplicationType = 'Windows'
             AND ApplicationName = 'Accounts'`
        );

      if (existing.recordset.length > 0 && existing.recordset[0].Password) {
        return {
          stopped: true,
          message: `Password has been already generated for College '${college}'`,
        };
      }

      await pool
        .request()
        .input("UserName", sql.VarChar, cleanParam(idNo))
        .input("Password", sql.VarChar, varPassword)
        .input("LoginType", sql.VarChar, cleanParam(loginType))
        .input("ApplicationType", sql.VarChar, "Windows")
        .input("ApplicationName", sql.VarChar, "Accounts")
        .input("CollegeName", sql.VarChar, college)
        .query(
          `INSERT INTO UserMaster
             (UserName, Password, LoginType, ApplicationType, ApplicationName, CollegeName)
           VALUES (@UserName, @Password, @LoginType, @ApplicationType, @ApplicationName, @CollegeName)`
        );
    }

    return { stopped: false, password: varPassword };
  });
}

module.exports = {
  getAssignedColleges,
  getLoginTypes,
  getStaffByIdNo,
  getStaffSnap,
  getAllColleges,
  getUserRecords,
  generatePasswordForColleges,
  cleanParam,
};