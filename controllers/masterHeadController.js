const masterHeadRepository = require("../models/masterHeadRepository");
const semesterRepository = require("../repositories/semesterRepository");

// GET /api/master-heads — mirrors Display() grid load
async function getMasterHeads(req, res) {
  try {
    console.log("========== REQUEST ==========");
    console.log("Query:", req.query);
    console.log("=============================");

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: { message: "userId is required." } });
    }

    const accessibleColleges = await semesterRepository.getCollege(userId);
    const data = await masterHeadRepository.listMasterHeads(accessibleColleges);
    res.json({ success: true, data, totalRecords: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// GET /api/master-heads/colleges — mirrors combo box population in Display()
async function getColleges(req, res) {
  try {
    const data = await masterHeadRepository.getAssignableColleges();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// POST /api/master-heads — mirrors btnSave_Click
async function createMasterHead(req, res) {
  try {
    const { collegeName, head, srNo } = req.body;
    if (!collegeName)
      return res.status(400).json({ success: false, error: { message: "Please enter College Name." } });
    if (!head)
      return res.status(400).json({ success: false, error: { message: "Please enter Head." } });
    if (srNo === undefined || srNo === null || srNo === "")
      return res.status(400).json({ success: false, error: { message: "Please enter SrNo." } });

    if (await masterHeadRepository.existsByCollegeAndHead(collegeName, head)) {
      return res.status(409).json({ success: false, error: { message: `${collegeName}, ${head} already alloted` } });
    }
    if (await masterHeadRepository.existsByCollegeAndSrNo(collegeName, srNo)) {
      return res.status(409).json({ success: false, error: { message: `${collegeName}, ${srNo} already alloted` } });
    }

    await masterHeadRepository.createMasterHead({ collegeName, head, srNo: Number(srNo) });
    res.json({ success: true, message: "Saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// PUT /api/master-heads — mirrors dgvMasterCategory_CellEndEdit
async function updateMasterHead(req, res) {
  try {
    const { original, collegeName, head, srNo } = req.body;
    if (!collegeName || !head || srNo === undefined || srNo === null || srNo === "")
      return res.status(400).json({ success: false, error: { message: "You can not leave field blank." } });

    if (await masterHeadRepository.existsByCollegeAndHeadOrSrNo(collegeName, head, srNo)) {
      return res.status(409).json({
        success: false,
        error: { message: `${collegeName}, ${head}, ${srNo} already alloted` },
      });
    }

    await masterHeadRepository.updateMasterHead(original, { collegeName, head, srNo: Number(srNo) });
    res.json({ success: true, message: "Updated successfully", data: { collegeName, head, srNo: Number(srNo) } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// DELETE /api/master-heads — mirrors dgvMasterCategory_UserDeletingRow
async function deleteMasterHead(req, res) {
  try {
    await masterHeadRepository.deleteMasterHead(req.body);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

module.exports = { getMasterHeads, getColleges, createMasterHead, updateMasterHead, deleteMasterHead };