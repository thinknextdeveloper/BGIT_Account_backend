const lookupModel = require("../models/lookupModel");

const colleges = async (req, res) => {
  try {
    const data = await lookupModel.getColleges();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const courses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    const data = await lookupModel.getCourses(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const batches = async (req, res) => {
  try {
    const { collegeName, course } = req.query;
    const data = await lookupModel.getBatches(collegeName, course);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const semestersForBatch = async (req, res) => {
  try {
    const { collegeName, course, batch } = req.query;
    const data = await lookupModel.getSemestersForBatch(collegeName, course, batch);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const validUpTo = async (req, res) => {
  try {
    const { collegeName, batch, semester, facility } = req.query;
    const data = await lookupModel.getValidUpTo({ collegeName, batch, semester, facility });
    return res.status(200).json({ success: true, data: { validUpTo: data } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { colleges, courses, batches, semestersForBatch, validUpTo };