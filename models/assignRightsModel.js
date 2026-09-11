const { sql, withRetry } = require("../config/db");

function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

// Mirrors: cmbLoginType.Click (commented block) —
// select distinct LoginType from MasterLoginType where LoginType Not IN('Student','Parents')
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

// Mirrors: PersonalDetail() first query —
// select CollegeName,IDNo,Name,FatherName,Department,Designation,Snap from Staff where IDNo=...
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

// Raw binary fetch for the photo endpoint, mirrors PictureBox1.Image load
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

// Mirrors: PersonalDetail() second query —
// select Password from UserMaster where UserName=... and logintype=... and
// ApplicationType='Windows' and ApplicationName='Accounts'
async function checkPasswordAssigned(idNo, loginType) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("idNo", sql.VarChar, cleanParam(idNo))
      .input("loginType", sql.VarChar, cleanParam(loginType))
      .query(
        `SELECT Password FROM UserMaster
         WHERE UserName = @idNo
           AND LoginType = @loginType
           AND ApplicationType = 'Windows'
           AND ApplicationName = 'Accounts'`
      );
    return result.recordset.length > 0;
  });
}

// Mirrors: ShowMenuDetail() —
// select ID_ITEM,TEXT from ITEMS where FUNC<>'No' order by ID_ITEM
async function getMenuItems() {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .query(`SELECT ID_ITEM, TEXT FROM ITEMS WHERE FUNC <> 'No' ORDER BY ID_ITEM`);
    return result.recordset;
  });
}

// Mirrors: ShowAssignedMenu() —
// select PERMS.ID_ITEM,ITEMS.TEXT from PERMS,ITEMS
// where PERMS.ID_ITEM=ITEMS.ID_ITEM and PERMS.ID_USER=... and PERMS.LoginType=...
async function getAssignedMenuItems(idNo, loginType) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("idNo", sql.VarChar, cleanParam(idNo))
      .input("loginType", sql.VarChar, cleanParam(loginType))
      .query(
        `SELECT PERMS.ID_ITEM, ITEMS.TEXT
         FROM PERMS
         INNER JOIN ITEMS ON PERMS.ID_ITEM = ITEMS.ID_ITEM
         WHERE PERMS.ID_USER = @idNo AND PERMS.LoginType = @loginType
         ORDER BY PERMS.ID_ITEM`
      );
    return result.recordset;
  });
}

// Mirrors: btnSubmit_Click —
// delete existing PERMS for (ID_USER, LoginType), then insert the current
// right-hand grid contents, each with a freshly generated Perm_ID.
// Wrapped in a transaction (the original ran this as loose sequential
// commands over one open connection).
async function submitRights(idNo, loginType, itemIds) {
  return withRetry(async (pool) => {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction)
        .input("idNo", sql.VarChar, cleanParam(idNo))
        .input("loginType", sql.VarChar, cleanParam(loginType))
        .query(`DELETE FROM PERMS WHERE ID_USER = @idNo AND LoginType = @loginType`);

      for (const itemId of itemIds) {
        // TODO: confirm this matches the real frmdebit.GenPermsID() —
        // not present in the code you shared, assumed MAX+1.
        const idResult = await new sql.Request(transaction).query(
          `SELECT ISNULL(MAX(Perm_ID), 0) + 1 AS NextId FROM PERMS`
        );
        const permId = idResult.recordset[0].NextId;

        await new sql.Request(transaction)
          .input("permId", sql.Int, permId)
          .input("idNo", sql.VarChar, cleanParam(idNo))
          .input("loginType", sql.VarChar, cleanParam(loginType))
          .input("itemId", sql.Int, itemId)
          .query(
            `INSERT INTO PERMS (PERM_ID, ID_USER, LoginType, ID_ITEM)
             VALUES (@permId, @idNo, @loginType, @itemId)`
          );
      }

      await transaction.commit();
      return { assignedCount: itemIds.length };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  });
}

module.exports = {
  getLoginTypes,
  getStaffByIdNo,
  getStaffSnap,
  checkPasswordAssigned,
  getMenuItems,
  getAssignedMenuItems,
  submitRights,
  cleanParam,
};