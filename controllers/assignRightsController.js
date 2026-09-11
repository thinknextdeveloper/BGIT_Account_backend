const {
  getLoginTypes,
  getStaffByIdNo,
  getStaffSnap,
  checkPasswordAssigned,
  getMenuItems,
  getAssignedMenuItems,
  submitRights,
  cleanParam,
} = require("../models/assignRightsModel");

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

    // TODO: mirrors frmdebit.EntryAlreadyExist(txtCollege.Text) — restricts
    // to colleges the logged-in user has rights over. Needs req.user /
    // session wiring; currently not enforced.
    // if (!userHasCollegeAccess(req.user, staff.CollegeName)) {
    //   return res.status(403).json({ success: false, message: "This ID No does not belong to your rights." });
    // }

    const hasPassword = await checkPasswordAssigned(idNo, loginType);

    if (!hasPassword) {
      return res.status(200).json({
        success: true,
        data: {
          staff,
          hasPassword: false,
          availableItems: [],
          assignedItems: [],
          message: "Password is not assigned to this 'ID No.' and 'Login Type'",
        },
      });
    }

    const [availableItems, assignedItems] = await Promise.all([
      getMenuItems(),
      getAssignedMenuItems(idNo, loginType),
    ]);

    return res.status(200).json({
      success: true,
      data: { staff, hasPassword: true, availableItems, assignedItems },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mirrors: PictureBox1.Image load from Staff.Snap
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

// Mirrors: btnSubmit_Click
const submit = async (req, res) => {
  try {
    const idNo = cleanParam(req.body.idNo);
    const loginType = cleanParam(req.body.loginType);
    const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds : [];

    if (!idNo) return res.status(400).json({ success: false, message: "Please specify ID No." });
    if (!isValidIdNo(idNo))
      return res.status(400).json({ success: false, message: "Please specify valid ID No." });
    if (!loginType)
      return res.status(400).json({ success: false, message: "Please specify Login Type" });

    const hasPassword = await checkPasswordAssigned(idNo, loginType);
    if (!hasPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is not assigned to this 'ID No.' and 'Login Type'",
      });
    }

    if (itemIds.length === 0) {
      return res.status(400).json({ success: false, message: "No Rights found to assigned." });
    }

    const data = await submitRights(idNo, loginType, itemIds);
    return res
      .status(200)
      .json({ success: true, message: "Rights has been assigned successfully", data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { loginTypes, findStaff, photo, submit };