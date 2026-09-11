const express = require("express");
const router = express.Router();
const {
  findStudent,
  hostelNames,
  roomTypes,
  roomNumbers,
  busRoutes,
  stopages,
  update,
} = require("../controllers/facilityController");

router.get("/student", findStudent);
router.get("/hostel-names", hostelNames);
router.get("/room-types", roomTypes);
router.get("/room-numbers", roomNumbers);
router.get("/bus-routes", busRoutes);
router.get("/stopages", stopages);
router.put("/update", update);

module.exports = router;