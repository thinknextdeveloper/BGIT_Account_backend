const {
  listHostelCharges,
  getDistinctColleges,
  getDistinctBatches,
  entryExists,
  createHostelCharge,
  updateHostelCharge,
  deleteHostelCharge,
} = require("../models/hostelChargesModel");

// ---- validation regexes, ported from the VB.NET Regex checks ----
const RE_NAME_AMP = /^[a-zA-Z0-9&?.,\- ]+$/; // College Name
const RE_NAME = /^[a-zA-Z0-9?.,\- ]+$/; // Hostel Name / Room Type
const RE_NUMERIC = /^[0-9]+$/; // Batch / HostelFee / TotalSeats
const RE_SECURITY = /^[a-zA-Z0-9?.,\-]+$/; // Hostel Security (no spaces, matches VB)

function validateRow(body) {
  const errors = [];
  const clean = {};

  const collegeName = (body.collegeName || "").trim();
  if (!collegeName) {
    errors.push("College Name Can't left blank");
  } else if (!RE_NAME_AMP.test(collegeName)) {
    errors.push("Invalid College Name");
  } else {
    clean.collegeName = collegeName;
  }

  const batch = (body.batch ?? "").toString().trim();
  if (!batch) {
    errors.push("Batch Can't left blank");
  } else if (!RE_NUMERIC.test(batch)) {
    errors.push("Invalid Batch");
  } else {
    clean.batch = batch;
  }

  const hostelName = (body.hostelName || "").trim();
  if (!hostelName) {
    errors.push("HostelName Can't left blank");
  } else if (!RE_NAME.test(hostelName)) {
    errors.push("Invalid HostelName");
  } else {
    clean.hostelName = hostelName;
  }

  const roomType = (body.roomType || "").trim();
  if (roomType && !RE_NAME.test(roomType)) {
    errors.push("Invalid RoomType");
  } else {
    clean.roomType = roomType || null;
  }

  const hostelFee = (body.hostelFee ?? "").toString().trim();
  if (!hostelFee) {
    errors.push("HostelFee Can't left blank");
  } else if (!RE_NUMERIC.test(hostelFee)) {
    errors.push("Invalid HostelFee");
  } else {
    clean.hostelFee = Number(hostelFee);
  }

  const totalSeats = (body.totalSeats ?? "").toString().trim();
  if (!totalSeats) {
    errors.push("TotalSeats Can't left blank");
  } else if (!RE_NUMERIC.test(totalSeats)) {
    errors.push("Invalid TotalSeats");
  } else {
    clean.totalSeats = Number(totalSeats);
  }

  const hostelSecurity = (body.hostelSecurity || "").trim();
  if (hostelSecurity && !RE_SECURITY.test(hostelSecurity)) {
    errors.push("Invalid Hostel Security");
  } else {
    clean.hostelSecurity = hostelSecurity || null;
  }

  return { errors, clean };
}

// GET /api/hostel-charges?collegeName=&batch= -> mirrors Display()
const display = async (req, res) => {
  try {
    const { collegeName, batch } = req.query;
    const rows = await listHostelCharges(collegeName, batch);
    return res.status(200).json({
      success: true,
      data: rows,
      totalRecords: rows.length,
      message: rows.length === 0 ? "No record Found" : undefined,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/hostel-charges/colleges
const getColleges = async (req, res) => {
  try {
    const colleges = await getDistinctColleges();
    return res.status(200).json({ success: true, data: colleges });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/hostel-charges/batches?collegeName=
const getBatches = async (req, res) => {
  try {
    const { collegeName } = req.query;
    const batches = await getDistinctBatches(collegeName);
    return res.status(200).json({ success: true, data: batches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/hostel-charges -> mirrors btnSave_Click (insert)
const create = async (req, res) => {
  try {
    const { errors, clean } = validateRow(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const duplicate = await entryExists(clean);
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Entry already exist" });
    }

    await createHostelCharge(clean);
    return res.status(201).json({
      success: true,
      message: "Record has been successfully inserted",
      data: clean,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/hostel-charges -> mirrors DataGridView1_CellValueChanged (update)
// Body: { original: { collegeName, batch, hostelName, roomType }, ...newValues }
// There is no surrogate key on MasterHostelCharges, so the row being edited is
// identified by its pre-edit natural key, exactly like the VB.NET grid did with
// varCollegeName / varBatch / varHostelName / varRoomType.
const update = async (req, res) => {
  try {
    const { original } = req.body;
    if (
      !original ||
      !original.collegeName ||
      !original.batch ||
      !original.hostelName
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Original record key is required" });
    }

    const { errors, clean } = validateRow(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const keyChanged =
      clean.collegeName !== original.collegeName ||
      clean.batch !== original.batch ||
      clean.hostelName !== original.hostelName ||
      clean.roomType !== (original.roomType || null);

    if (keyChanged) {
      const duplicate = await entryExists(clean);
      if (duplicate) {
        return res.status(409).json({ success: false, message: "Entry already exist" });
      }
    }

    const rowsAffected = await updateHostelCharge(original, clean);
    if (rowsAffected === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Record has been successfully updated",
      data: clean,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/hostel-charges -> mirrors DataGridView1_UserDeletingRow
// Body: { collegeName, batch, hostelName, roomType }
const remove = async (req, res) => {
  try {
    const { collegeName, batch, hostelName, roomType } = req.body;
    if (!collegeName || !batch || !hostelName) {
      return res.status(400).json({ success: false, message: "Invalid CollegeName" });
    }

    const rowsAffected = await deleteHostelCharge({
      collegeName,
      batch,
      hostelName,
      roomType,
    });
    if (rowsAffected === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, message: "Data Deleted Successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { display, getColleges, getBatches, create, update, remove };