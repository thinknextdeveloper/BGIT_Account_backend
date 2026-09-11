const {
  getStudentByIdOrReg,
  getHostelNames,
  getRoomTypesForHostel,
  getRoomNumbers,
  getBusRoutes,
  getStopagesForRoute,
  updateFacility,
} = require("../models/facilityModel");

const findStudent = async (req, res) => {
  try {
    const { idNo, registrationNo } = req.query;

    if (!idNo && !registrationNo) {
      return res.status(400).json({
        success: false,
        message: "Provide idNo or registrationNo.",
      });
    }

    const student = await getStudentByIdOrReg({ idNo, registrationNo });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Find student error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const hostelNames = async (req, res) => {
  try {
    const names = await getHostelNames();
    return res.status(200).json({ success: true, data: names });
  } catch (error) {
    console.error("Hostel names error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const roomTypes = async (req, res) => {
  try {
    const { hostelName } = req.query;
    const types = await getRoomTypesForHostel(hostelName);
    return res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error("Room types error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const roomNumbers = async (req, res) => {
  try {
    const { hostelName, roomType } = req.query;
    const rooms = await getRoomNumbers(hostelName, roomType);
    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    console.error("Room numbers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const busRoutes = async (req, res) => {
  try {
    const routes = await getBusRoutes();
    return res.status(200).json({ success: true, data: routes });
  } catch (error) {
    console.error("Bus routes error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const stopages = async (req, res) => {
  try {
    const { route } = req.query;
    const stops = await getStopagesForRoute(route);
    return res.status(200).json({ success: true, data: stops });
  } catch (error) {
    console.error("Stopages error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { idNo, facility } = req.body;

    if (!idNo || !facility?.type) {
      return res.status(400).json({
        success: false,
        message: "idNo and facility.type are required.",
      });
    }

    const updated = await updateFacility(idNo, facility);
    return res.status(200).json({ success: true, message: "Facility updated.", data: updated });
  } catch (error) {
    console.error("Update facility error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  findStudent,
  hostelNames,
  roomTypes,
  roomNumbers,
  busRoutes,
  stopages,
  update,
};