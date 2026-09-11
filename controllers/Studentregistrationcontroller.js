const model = require("../models/studentRegistrationModel");

/* ------------------------------------------------------------------ */
/*  Admission record — Display / Update                                */
/* ------------------------------------------------------------------ */

// GET /api/student-registration?idNo=...
// Mirrors displayMethod(). No record -> 404 (VB: MsgBox + Newentry()).
const getAdmission = async (req, res) => {
  try {
    const { idNo } = req.query;
    if (!idNo) {
      return res.status(400).json({ success: false, message: "idNo is required" });
    }

    const record = await model.getFullAdmissionByIdNo(idNo);
    if (!record) {
      return res.status(404).json({ success: false, message: "This IDNo has no record" });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/student-registration
// Body: { idNo, collegeName, ...fields }
// Mirrors updateStudentAdmissions(): UPDATE only, keyed on IDNo + CollegeName.
const updateAdmission = async (req, res) => {
  try {
    const { idNo, collegeName, ...fields } = req.body;

    if (!idNo || !collegeName) {
      return res.status(400).json({ success: false, message: "idNo and collegeName are required" });
    }

    const updated = await model.updateAdmission(idNo, collegeName, fields);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "No matching record for this IDNo / CollegeName",
      });
    }

    const record = await model.getFullAdmissionByIdNo(idNo);
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  Master / dropdown data                                             */
/* ------------------------------------------------------------------ */

const getColleges = async (_req, res) => {
  try {
    const data = await model.getColleges();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCategories = async (_req, res) => {
  try {
    const data = await model.getCategoryMasterList();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getVillages = async (_req, res) => {
  try {
    const data = await model.getVillages();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getDistricts = async (_req, res) => {
  try {
    const data = await model.getDistricts();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getTehsils = async (_req, res) => {
  try {
    const data = await model.getTehsils();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getGroupNames = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }
    const data = await model.getGroupNames(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getConcessionDetailsList = async (req, res) => {
  try {
    const { collegeName } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }
    const data = await model.getConcessionDetailsList(collegeName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getConcessionLookup = async (req, res) => {
  try {
    const { collegeName, concessionDetails } = req.query;
    if (!collegeName || !concessionDetails) {
      return res.status(200).json({ success: true, data: { ConcessionPerc: null, ConcessionAmount: null } });
    }
    const data = await model.getConcessionLookup(collegeName, concessionDetails);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getHostelNames = async (req, res) => {
  try {
    const { collegeName, batch } = req.query;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "collegeName is required" });
    }
    const data = await model.getHostelNames(collegeName, batch);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRoomTypes = async (req, res) => {
  try {
    const { collegeName, batch, hostelName } = req.query;
    if (!collegeName || !hostelName) {
      return res.status(400).json({ success: false, message: "collegeName and hostelName are required" });
    }
    const data = await model.getRoomTypes(collegeName, batch, hostelName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getHostelFee = async (req, res) => {
  try {
    const { collegeName, batch, hostelName, roomType } = req.query;
    if (!collegeName || !hostelName || !roomType) {
      return res.status(400).json({ success: false, message: "collegeName, hostelName and roomType are required" });
    }
    const HostelFee = await model.getHostelFee(collegeName, batch, hostelName, roomType);
    return res.status(200).json({ success: true, data: { HostelFee } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getBusRoutes = async (req, res) => {
  try {
    const { session } = req.query;
    if (!session) {
      return res.status(400).json({ success: false, message: "session is required" });
    }
    const data = await model.getBusRoutes(session);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getStopages = async (req, res) => {
  try {
    const { session, route } = req.query;
    if (!session || !route) {
      return res.status(400).json({ success: false, message: "session and route are required" });
    }
    const data = await model.getStopages(session, route);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getBusFee = async (req, res) => {
  try {
    const { session, route, stopage } = req.query;
    if (!session || !route || !stopage) {
      return res.status(400).json({ success: false, message: "session, route and stopage are required" });
    }
    const Fee = await model.getBusFee(session, route, stopage);
    return res.status(200).json({ success: true, data: { Fee } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdmission,
  updateAdmission,
  getColleges,
  getCategories,
  getVillages,
  getDistricts,
  getTehsils,
  getGroupNames,
  getConcessionDetailsList,
  getConcessionLookup,
  getHostelNames,
  getRoomTypes,
  getHostelFee,
  getBusRoutes,
  getStopages,
  getBusFee,
};