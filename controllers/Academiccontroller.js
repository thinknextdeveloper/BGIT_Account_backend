const model = require("../models/academicModel");

/* ------------------------------------------------------------------ */
/*  EduQualification                                                    */
/* ------------------------------------------------------------------ */

// GET /api/academic/edu-qualifications?idNo=...
const getEduQualifications = async (req, res) => {
  try {
    const { idNo } = req.query;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "idNo is required" });
    }
    const data = await model.getEduQualifications(idNo);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/academic/edu-qualifications
// Body: { idNo, rows: [...] }
const saveEduQualifications = async (req, res) => {
  try {
    const { idNo, rows } = req.body;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "idNo is required" });
    }
    await model.saveEduQualifications(idNo, rows || []);
    const data = await model.getEduQualifications(idNo);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  DocumentStatus                                                      */
/* ------------------------------------------------------------------ */

// GET /api/academic/document-status?idNo=...&collegeName=...
const getDocumentStatus = async (req, res) => {
  try {
    const { idNo, collegeName } = req.query;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "idNo is required" });
    }
    const data = await model.getDocumentStatus(idNo, collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/academic/document-status
// Body: { idNo, studentName, rows: [...] }
const saveDocumentStatus = async (req, res) => {
  try {
    const { idNo, studentName, rows } = req.body;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "idNo is required" });
    }
    await model.saveDocumentStatus(idNo, studentName, rows || []);
    const data = await model.getDocumentStatus(idNo);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/academic/document-status?idNo=...
const deleteDocumentStatus = async (req, res) => {
  try {
    const { idNo } = req.query;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "idNo is required" });
    }
    await model.deleteDocumentStatus(idNo);
    return res.status(200).json({ success: true, data: [] });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  Academic master lists                                              */
/* ------------------------------------------------------------------ */

const getPreviousCourses = async (_req, res) => {
  try {
    const data = await model.getPreviousCourses();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPreviousBoards = async (_req, res) => {
  try {
    const data = await model.getPreviousBoards();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getInstitutionsLastAttended = async (_req, res) => {
  try {
    const data = await model.getInstitutionsLastAttended();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEduQualifications,
  saveEduQualifications,
  getDocumentStatus,
  saveDocumentStatus,
  deleteDocumentStatus,
  getPreviousCourses,
  getPreviousBoards,
  getInstitutionsLastAttended,
};