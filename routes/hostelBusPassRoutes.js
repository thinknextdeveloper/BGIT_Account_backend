const express = require("express");
const router = express.Router();

const lookupController = require("../controllers/lookupController");
const studentController = require("../controllers/studentController");
const printedPassController = require("../controllers/printedPassController");

router.get("/colleges", lookupController.colleges);
router.get("/courses", lookupController.courses);
router.get("/batches", lookupController.batches);
router.get("/semesters", lookupController.semestersForBatch);
router.get("/valid-upto", lookupController.validUpTo);

router.get("/student", studentController.display);

router.post("/save", printedPassController.save);
router.post("/issue-card", printedPassController.issueCard);

module.exports = router;