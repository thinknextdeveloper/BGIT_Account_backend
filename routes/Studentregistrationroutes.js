const express = require("express");
const router = express.Router();
const reg = require("../controllers/studentRegistrationController");
const academic = require("../controllers/academicController");

/* ---- Admission record (Registration tab) ---- */
router.get("/", reg.getAdmission);              // GET  /api/student-registration?idNo=...
router.put("/", reg.updateAdmission);            // PUT  /api/student-registration

/* ---- Masters (Registration tab dropdowns) ---- */
router.get("/masters/colleges", reg.getColleges);
router.get("/masters/categories", reg.getCategories);
router.get("/masters/villages", reg.getVillages);
router.get("/masters/districts", reg.getDistricts);
router.get("/masters/tehsils", reg.getTehsils);
router.get("/masters/group-names", reg.getGroupNames);
router.get("/masters/concession-details", reg.getConcessionDetailsList);
router.get("/masters/concession-lookup", reg.getConcessionLookup);
router.get("/masters/hostel-names", reg.getHostelNames);
router.get("/masters/room-types", reg.getRoomTypes);
router.get("/masters/hostel-fee", reg.getHostelFee);
router.get("/masters/bus-routes", reg.getBusRoutes);
router.get("/masters/stopages", reg.getStopages);
router.get("/masters/bus-fee", reg.getBusFee);

/* ---- Academic tab ---- */
router.get("/academic/edu-qualifications", academic.getEduQualifications);
router.put("/academic/edu-qualifications", academic.saveEduQualifications);
router.get("/academic/document-status", academic.getDocumentStatus);
router.put("/academic/document-status", academic.saveDocumentStatus);
router.delete("/academic/document-status", academic.deleteDocumentStatus);
router.get("/academic/masters/previous-courses", academic.getPreviousCourses);
router.get("/academic/masters/previous-boards", academic.getPreviousBoards);
router.get("/academic/masters/institutions", academic.getInstitutionsLastAttended);

module.exports = router;