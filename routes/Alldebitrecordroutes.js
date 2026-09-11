const express = require("express");
const router = express.Router();

const {
  colleges,
  courses,
  batches,
  semesters,
  heads,
  display,
} = require("../controllers/allDebitRecordController");

// GET /api/all-debit-record/colleges
router.get("/colleges", colleges);

// GET /api/all-debit-record/courses?collegeName=...
router.get("/courses", courses);

// GET /api/all-debit-record/batches?collegeName=...
router.get("/batches", batches);

// GET /api/all-debit-record/semesters?collegeName=...&course=...&batch=...
router.get("/semesters", semesters);

// GET /api/all-debit-record/heads?collegeName=...
router.get("/heads", heads);

// GET /api/all-debit-record/display?collegeName=...&course=...&batch=...&semester=...
router.get("/display", display);

module.exports = router;