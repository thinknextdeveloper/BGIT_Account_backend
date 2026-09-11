const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const semesterController = require("../controllers/semesterController");

// All routes are protected by JWT authentication middleware
router.use(authenticateToken);

// 1. DisplayAll records from MasterCurrentSemester
router.get("/display-all", semesterController.displayAll);

// 2. Get distinct assigned colleges
router.get("/colleges", semesterController.getCollege);

// 3. Get raw assigned college names from UserMaster
router.get("/assigned-colleges", semesterController.getAssignedCollegeName);

// 4. Check if entry / college exists for user
router.get("/check-college", semesterController.entryAlreadyExist);

// 5. Get distinct courses
router.get("/courses", semesterController.getCourse);

// 6. Get distinct batches
router.get("/batches", semesterController.getBatch);

// 7. Get distinct semesters ordered by SemesterID
router.get("/semesters", semesterController.getSemester);

// 8. Add new record to MasterCurrentSemester
router.post("/add", semesterController.createSemester);

module.exports = router;
