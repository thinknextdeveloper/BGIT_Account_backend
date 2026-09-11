const express = require("express");
const router = express.Router();
const {
  display,
  getColleges,
  getBatches,
  create,
  update,
  remove,
} = require("../controllers/Hostelchargescontroller ");

// GET /api/hostel-charges/colleges
router.get("/colleges", getColleges);

// GET /api/hostel-charges/batches?collegeName=
router.get("/batches", getBatches);

// GET /api/hostel-charges?collegeName=&batch=
router.get("/", display);

// POST /api/hostel-charges
router.post("/", create);

// PUT /api/hostel-charges  (body: { original: {...}, ...newValues })
router.put("/", update);

// DELETE /api/hostel-charges  (body: { collegeName, batch, hostelName, roomType })
router.delete("/", remove);

module.exports = router;

// In app.js / server.js:
