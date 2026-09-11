const {
  getColleges,
  getCoursesForCollege,
  listDeadDebits,
  deleteDeadDebit,
} = require("../models/deadDebitsModel");

const getColleges_ = async (req, res) => {
  try {
    const colleges = await getColleges();
    return res.status(200).json({ success: true, colleges });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }
    const courses = await getCoursesForCollege(collegeName);
    return res.status(200).json({ success: true, courses });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors VB cmbCollege_SelectedIndexChanged: collegeName present -> Display()
// (filtered, optionally by course too); collegeName absent -> DisplayAll().
const listRecords = async (req, res) => {
  try {
    const { collegeName, course, page, pageSize } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

    const { rows, totalRecords } = await listDeadDebits({
      collegeName: collegeName || undefined,
      course: course || undefined,
      page: pageNum,
      pageSize: pageSizeNum,
    });

    return res.status(200).json({
      success: true,
      rows,
      totalRecords,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(totalRecords / pageSizeNum),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// The pasted VB form has no delete handler, but the UI requires a comment
// before deleting (red note). Mirrors that same validation order.
const deleteRecord = async (req, res) => {
  try {
    const { transactionId, comments } = req.body;

    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please specify comment to delete debit entry",
      });
    }
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Please select a record",
      });
    }

    const result = await deleteDeadDebit({
      transactionId: Number(transactionId),
      comments: comments.trim(),
      userId: req.user?.username || req.user?.id || null,
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getColleges: getColleges_,
  getCourses,
  listRecords,
  deleteRecord,
};