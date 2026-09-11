const {
  getAssignedColleges,
  getLoginTypes,
  getStaffByIdNo,
  getStaffSnap,
  getAllColleges,
  getUserRecords,
  generatePasswordForColleges,
  cleanParam,
} = require("../models/userManagementModel");

function isValidIdNo(idNo) {
  const s = cleanParam(idNo);
  return !!s && /^\d{6}$/.test(s);
}

const loginTypes = async (req, res) => {
  try {
    const data = await getLoginTypes();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const photo = async (req, res) => {
  try {
    const idNo = cleanParam(req.params.idNo);
    if (!idNo) return res.status(400).end();
    const snap = await getStaffSnap(idNo);
    if (!snap) return res.status(404).end();
    res.set("Content-Type", "image/jpeg");
    return res.status(200).send(snap);
  } catch (err) {
    console.error(err);
    return res.status(500).end();
  }
};

// Mirrors: btnFind_Click -> PersonalDetail()
const findStaff = async (req, res) => {
  try {
    const idNo = cleanParam(req.query.idNo);
    const loginType = cleanParam(req.query.loginType);

    if (!idNo) return res.status(400).json({ success: false, message: "Please specify ID No." });
    if (!isValidIdNo(idNo))
      return res.status(400).json({ success: false, message: "Please specify valid ID No." });
    if (!loginType)
      return res.status(400).json({ success: false, message: "Please specify Login Type" });

    const staff = await getStaffByIdNo(idNo);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Sorry no record found" });
    }

    // TODO: mirrors frmdebit.EntryAlreadyExist(txtCollege.Text) — see note
    // in assignRightsController.js. Not enforced yet.
    // if (!userHasCollegeAccess(req.user, staff.CollegeName)) {
    //   return res.status(403).json({ success: false, message: "This ID No does not belongs to your rights" });
    // }

    const assignedColleges = await getAssignedColleges(/* req.user */);
    const [userRecords, colleges] = await Promise.all([
      getUserRecords(idNo, assignedColleges),
      getAllColleges(assignedColleges),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        staff,
        userRecords,
        totalRecords: userRecords.length,
        colleges,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors: btnGeneratePassword_Click
const generatePassword = async (req, res) => {
  try {
    const idNo = cleanParam(req.body.idNo);
    const loginType = cleanParam(req.body.loginType);
    const colleges = Array.isArray(req.body.colleges) ? req.body.colleges.filter(Boolean) : [];

    if (!idNo) return res.status(400).json({ success: false, message: "Please specify ID No." });
    if (!isValidIdNo(idNo))
      return res.status(400).json({ success: false, message: "Please specify valid ID No." });
    if (!loginType)
      return res.status(400).json({ success: false, message: "Please specify Login Type" });
    if (colleges.length === 0)
      return res.status(400).json({ success: false, message: "Please specify College Name" });

    const result = await generatePasswordForColleges(idNo, loginType, colleges);

    if (result.stopped) {
      // Same as original: on hitting an already-generated college, it
      // re-loads the records grid and stops without inserting further.
      const assignedColleges = await getAssignedColleges(/* req.user */);
      const userRecords = await getUserRecords(idNo, assignedColleges);
      return res.status(400).json({
        success: false,
        message: result.message,
        data: { userRecords, totalRecords: userRecords.length },
      });
    }

    const assignedColleges = await getAssignedColleges(/* req.user */);
    const userRecords = await getUserRecords(idNo, assignedColleges);

    return res.status(200).json({
      success: true,
      message: "Password generated successfully",
      data: { userRecords, totalRecords: userRecords.length },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { loginTypes, photo, findStaff, generatePassword };