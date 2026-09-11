const express = require("express");
const router = express.Router();
const {
  getColleges,
  getCourses,
  getBatches,
  getSemesters,
} = require("../controllers/masterCourseController");

router.get("/colleges", getColleges);
router.get("/courses", getCourses);
router.get("/batches", getBatches);
router.get("/semesters", getSemesters);

module.exports = router;