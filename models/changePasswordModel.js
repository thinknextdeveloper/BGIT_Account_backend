const { sql, withRetry } = require("../config/db");

function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

// Mirrors: the SELECT guard before the UPDATE —
// SELECT Password FROM UserMaster WHERE UserName=@USERID AND Password=@PASSWORD
// AND LoginType=... AND ApplicationType='Windows' AND ApplicationName='Accounts'
async function verifyOldPassword(userId, oldPassword, loginType) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("userId", sql.VarChar, cleanParam(userId))
      .input("password", sql.VarChar, oldPassword)
      .input("loginType", sql.VarChar, cleanParam(loginType))
      .query(
        `SELECT Password FROM UserMaster
         WHERE UserName = @userId AND Password = @password
           AND LoginType = @loginType AND ApplicationType = 'Windows'
           AND ApplicationName = 'Accounts'`
      );
    return result.recordset.length > 0;
  });
}

// Mirrors: the UPDATE —
// UPDATE UserMaster SET Password=@Password WHERE UserName=@UserName
// AND ApplicationType='Windows' AND ApplicationName='Accounts'
// (not scoped by LoginType/CollegeName, same as the original — updates
// every UserMaster row for that user across all colleges/logins)
async function updatePassword(userId, newPassword) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("password", sql.VarChar, newPassword)
      .input("userId", sql.VarChar, cleanParam(userId))
      .query(
        `UPDATE UserMaster SET Password = @password
         WHERE UserName = @userId AND ApplicationType = 'Windows'
           AND ApplicationName = 'Accounts'`
      );
    return result.rowsAffected[0] || 0;
  });
}

module.exports = { verifyOldPassword, updatePassword, cleanParam };