const { sql, withRetry } = require("../config/db");
const semesterRepository = require("../repositories/semesterRepository"); // has getCollege, entryAlreadyExist

function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

// Mirrors: Display() combo box source —
// SELECT DISTINCT CollegeName FROM MasterCourse ORDER BY CollegeName,
// filtered to colleges where frmdebit.EntryAlreadyExist(CollegeName) = True
async function getAssignableColleges() {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .query(`SELECT DISTINCT CollegeName FROM MasterCourse ORDER BY CollegeName`);
    const allColleges = result.recordset.map((r) => r.CollegeName);

    const assignable = [];
    for (const college of allColleges) {
      if (await semesterRepository.entryAlreadyExist(college)) {
        assignable.push(college);
      }
    }
    return assignable;
  });
}

// Mirrors: Display() grid source —
// SELECT DISTINCT CollegeName, Head, ID FROM MasterHeads
// WHERE CollegeName IN (accessible colleges) ORDER BY CollegeName, ID, Head
async function listMasterHeads(accessibleColleges) {
  return withRetry(async (pool) => {
    if (!accessibleColleges || accessibleColleges.length === 0) return [];

    const request = pool.request();
    const inClause = accessibleColleges
      .map((college, i) => {
        const paramName = `college${i}`;
        request.input(paramName, sql.VarChar, college);
        return `@${paramName}`;
      })
      .join(", ");

    const result = await request.query(
      `SELECT DISTINCT CollegeName, Head, ID
       FROM MasterHeads
       WHERE CollegeName IN (${inClause})
       ORDER BY CollegeName, ID, Head`
    );
    return result.recordset;
  });
}

// Mirrors: btnSave_Click duplicate check on (CollegeName, Head)
async function existsByCollegeAndHead(collegeName, head) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("head", sql.VarChar, cleanParam(head))
      .query(`SELECT * FROM MasterHeads WHERE CollegeName = @collegeName AND Head = @head`);
    return result.recordset.length > 0;
  });
}

// Mirrors: btnSave_Click duplicate check on (CollegeName, ID)
async function existsByCollegeAndSrNo(collegeName, srNo) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("srNo", sql.Int, srNo)
      .query(`SELECT * FROM MasterHeads WHERE CollegeName = @collegeName AND ID = @srNo`);
    return result.recordset.length > 0;
  });
}

// Mirrors: CellEndEdit duplicate check on (CollegeName, Head OR ID)
async function existsByCollegeAndHeadOrSrNo(collegeName, head, srNo) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("head", sql.VarChar, cleanParam(head))
      .input("srNo", sql.Int, srNo)
      .query(
        `SELECT * FROM MasterHeads
         WHERE CollegeName = @collegeName AND (Head = @head OR ID = @srNo)`
      );
    return result.recordset.length > 0;
  });
}

// Mirrors: btnSave_Click insert —
// INSERT INTO MasterHeads (CollegeName, Head, ID) VALUES (@CollegeName, @Head, @ID)
async function createMasterHead({ collegeName, head, srNo }) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("head", sql.VarChar, cleanParam(head))
      .input("srNo", sql.Int, srNo)
      .query(
        `INSERT INTO MasterHeads (CollegeName, Head, ID)
         VALUES (@collegeName, @head, @srNo)`
      );
    return result.rowsAffected[0] || 0;
  });
}

// Mirrors: dgvMasterCategory_CellEndEdit update —
// No surrogate key on this table (same as the VB.NET original), so the row to update
// is identified by its ORIGINAL natural key — pass the pre-edit values in `originalKey`.
async function updateMasterHead(originalKey, data) {
  return withRetry(async (pool) => {
    const request = pool.request();
    request
      .input("collegeName", sql.VarChar, cleanParam(data.collegeName))
      .input("head", sql.VarChar, cleanParam(data.head))
      .input("srNo", sql.Int, data.srNo)
      .input("oldCollegeName", sql.VarChar, cleanParam(originalKey.collegeName))
      .input("oldHead", sql.VarChar, cleanParam(originalKey.head))
      .input("oldSrNo", sql.Int, originalKey.srNo);

    const result = await request.query(
      `UPDATE MasterHeads
         SET CollegeName = @collegeName, Head = @head, ID = @srNo
       WHERE CollegeName = @oldCollegeName AND Head = @oldHead AND ID = @oldSrNo`
    );
    return result.rowsAffected[0] || 0;
  });
}

// Mirrors: dgvMasterCategory_UserDeletingRow —
// DELETE FROM MasterHeads WHERE CollegeName=@CollegeName AND Head=@Head AND ID=@ID
async function deleteMasterHead({ collegeName, head, srNo }) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("head", sql.VarChar, cleanParam(head))
      .input("srNo", sql.Int, srNo)
      .query(
        `DELETE FROM MasterHeads WHERE CollegeName = @collegeName AND Head = @head AND ID = @srNo`
      );
    return result.rowsAffected[0] || 0;
  });
}

module.exports = {
  getAssignableColleges,
  listMasterHeads,
  existsByCollegeAndHead,
  existsByCollegeAndSrNo,
  existsByCollegeAndHeadOrSrNo,
  createMasterHead,
  updateMasterHead,
  deleteMasterHead,
  cleanParam,
};