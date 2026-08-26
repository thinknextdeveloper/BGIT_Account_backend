const express = require("express");
const router = express.Router();
const {
  courses,
  batches,
  semesters,
  subHeads,
  sessions,
  report,
} = require("../controllers/customSubLedgersController");

router.get("/courses", courses);       // ?college=
router.get("/batches", batches);       // ?college=
router.get("/semesters", semesters);   // ?college=
router.get("/sub-heads", subHeads);    // ?college=
router.get("/sessions", sessions);
router.get("/report", report);         // ?college=&course=&batch=&semester=&session=&dateFrom=&dateTo=&subHeads=a,b,c

module.exports = router;