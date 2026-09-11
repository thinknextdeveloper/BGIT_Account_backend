const { sql, withRetry } = require("../config/db");

function cleanParam(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === "" || ["undefined", "null", "select"].includes(s.toLowerCase())) return null;
  return s;
}

// Mirrors: Display() —
// SELECT CollegeName,Batch,HostelName,Roomtype,HostelFee,TotalSeats,HostelSecurity
// FROM MasterHostelCharges [WHERE CollegeName=@collegeName [AND Batch=@batch]]
async function listHostelCharges(collegeName, batch) {
  return withRetry(async (pool) => {
    const request = pool.request();
    let query = `SELECT CollegeName, Batch, HostelName, RoomType, HostelFee, TotalSeats, HostelSecurity
                 FROM MasterHostelCharges`;

    const college = cleanParam(collegeName);
    const batchClean = cleanParam(batch);

    if (college) {
      query += " WHERE CollegeName = @collegeName";
      request.input("collegeName", sql.VarChar, college);

      if (batchClean) {
        query += " AND Batch = @batch";
        request.input("batch", sql.VarChar, batchClean);
      }
    }

    query += " ORDER BY CollegeName, Batch";

    const result = await request.query(query);
    return result.recordset;
  });
}

// Mirrors: cmbCollege_Click -> frmdebit.FillCollege — distinct college names for the dropdown
async function getDistinctColleges() {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .query(
        `SELECT DISTINCT CollegeName FROM MasterHostelCharges
         WHERE CollegeName IS NOT NULL ORDER BY CollegeName`
      );
    return result.recordset.map((r) => r.CollegeName);
  });
}

// Mirrors: cmbBatch_Click -> frmdebit.FillBatch — distinct batches, optionally scoped to a college
async function getDistinctBatches(collegeName) {
  return withRetry(async (pool) => {
    const request = pool.request();
    let query = "SELECT DISTINCT Batch FROM MasterHostelCharges WHERE Batch IS NOT NULL";

    const college = cleanParam(collegeName);
    if (college) {
      query += " AND CollegeName = @collegeName";
      request.input("collegeName", sql.VarChar, college);
    }

    query += " ORDER BY Batch";

    const result = await request.query(query);
    return result.recordset.map((r) => r.Batch);
  });
}

// Mirrors: sameentrycheckpoint() —
// SELECT HostelName FROM MasterHostelCharges
// WHERE CollegeName=@collegeName AND Batch=@batch AND HostelName=@hostelName AND Roomtype=@roomType
async function entryExists({ collegeName, batch, hostelName, roomType }) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("batch", sql.VarChar, cleanParam(batch))
      .input("hostelName", sql.VarChar, cleanParam(hostelName))
      .input("roomType", sql.VarChar, cleanParam(roomType))
      .query(
        `SELECT HostelName FROM MasterHostelCharges
         WHERE CollegeName = @collegeName AND Batch = @batch
           AND HostelName = @hostelName AND RoomType = @roomType`
      );
    return result.recordset.length > 0;
  });
}

// Mirrors: btnSave_Click insert —
// INSERT INTO MasterHostelCharges (CollegeName, Batch, HostelName, RoomType, HostelFee, TotalSeats, HostelSecurity)
// VALUES (@CollegeName, @Batch, @HostelName, @RoomType, @HostelFee, @TotalSeats, @HostelSecurity)
async function createHostelCharge({
  collegeName,
  batch,
  hostelName,
  roomType,
  hostelFee,
  totalSeats,
  hostelSecurity,
}) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("batch", sql.VarChar, cleanParam(batch))
      .input("hostelName", sql.VarChar, cleanParam(hostelName))
      .input("roomType", sql.VarChar, cleanParam(roomType))
      .input("hostelFee", sql.Int, hostelFee)
      .input("totalSeats", sql.Int, totalSeats)
      .input("hostelSecurity", sql.VarChar, cleanParam(hostelSecurity))
      .query(
        `INSERT INTO MasterHostelCharges
           (CollegeName, Batch, HostelName, RoomType, HostelFee, TotalSeats, HostelSecurity)
         VALUES (@collegeName, @batch, @hostelName, @roomType, @hostelFee, @totalSeats, @hostelSecurity)`
      );
    return result.rowsAffected[0] || 0;
  });
}

// Mirrors: DataGridView1_CellValueChanged update —
// UPDATE MasterHostelCharges SET ... WHERE CollegeName=@oldCollegeName AND Batch=@oldBatch
//   AND HostelName=@oldHostelName AND RoomType=@oldRoomType
// There's no surrogate key on this table (same as the VB.NET original), so the row to
// update is identified by its ORIGINAL natural key — pass the pre-edit values in
// `originalKey`, and the new values in `data`.
async function updateHostelCharge(originalKey, data) {
  return withRetry(async (pool) => {
    const request = pool.request();
    request
      .input("collegeName", sql.VarChar, cleanParam(data.collegeName))
      .input("batch", sql.VarChar, cleanParam(data.batch))
      .input("hostelName", sql.VarChar, cleanParam(data.hostelName))
      .input("roomType", sql.VarChar, cleanParam(data.roomType))
      .input("hostelFee", sql.Int, data.hostelFee)
      .input("totalSeats", sql.Int, data.totalSeats)
      .input("hostelSecurity", sql.VarChar, cleanParam(data.hostelSecurity))
      .input("oldCollegeName", sql.VarChar, cleanParam(originalKey.collegeName))
      .input("oldBatch", sql.VarChar, cleanParam(originalKey.batch))
      .input("oldHostelName", sql.VarChar, cleanParam(originalKey.hostelName))
      .input("oldRoomType", sql.VarChar, cleanParam(originalKey.roomType));

    const result = await request.query(
      `UPDATE MasterHostelCharges
         SET CollegeName = @collegeName,
             Batch = @batch,
             HostelName = @hostelName,
             RoomType = @roomType,
             HostelFee = @hostelFee,
             TotalSeats = @totalSeats,
             HostelSecurity = @hostelSecurity
       WHERE CollegeName = @oldCollegeName AND Batch = @oldBatch
         AND HostelName = @oldHostelName AND RoomType = @oldRoomType`
    );
    return result.rowsAffected[0] || 0;
  });
}

// Mirrors: DataGridView1_UserDeletingRow —
// DELETE FROM MasterHostelCharges WHERE CollegeName=@collegeName AND Batch=@batch
//   AND HostelName=@hostelName AND RoomType=@roomType
async function deleteHostelCharge({ collegeName, batch, hostelName, roomType }) {
  return withRetry(async (pool) => {
    const result = await pool
      .request()
      .input("collegeName", sql.VarChar, cleanParam(collegeName))
      .input("batch", sql.VarChar, cleanParam(batch))
      .input("hostelName", sql.VarChar, cleanParam(hostelName))
      .input("roomType", sql.VarChar, cleanParam(roomType))
      .query(
        `DELETE FROM MasterHostelCharges
         WHERE CollegeName = @collegeName AND Batch = @batch
           AND HostelName = @hostelName AND RoomType = @roomType`
      );
    return result.rowsAffected[0] || 0;
  });
}

module.exports = {
  listHostelCharges,
  getDistinctColleges,
  getDistinctBatches,
  entryExists,
  createHostelCharge,
  updateHostelCharge,
  deleteHostelCharge,
  cleanParam,
};