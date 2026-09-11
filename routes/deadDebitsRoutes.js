const express = require("express");
const router = express.Router();
const {
  getColleges,
  getCourses,
  listRecords,
  deleteRecord,
} = require("../controllers/deadDebitsController");

// GET /api/dead-debits/colleges
router.get("/colleges", getColleges);

// GET /api/dead-debits/courses?collegeName=
router.get("/courses", getCourses);

// GET /api/dead-debits?collegeName=&course=
router.get("/", listRecords);

// POST /api/dead-debits/delete  (body: transactionId, comments)
router.post("/delete", deleteRecord);

module.exports = router;