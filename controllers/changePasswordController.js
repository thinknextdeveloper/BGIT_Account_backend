const { verifyOldPassword, updatePassword } = require("../models/changePasswordModel");

function getSessionUser(req) {
  return {
    userName: req.user?.username || null,
    loginType: req.user?.role || null,
  };
}

const submit = async (req, res) => {
  try {
    const { userName, loginType } = getSessionUser(req);
    if (!userName) return res.status(401).json({ success: false, message: "Not logged in" });

    const oldPassword = req.body.oldPassword || "";
    const newPassword = req.body.newPassword || "";
    const confirmPassword = req.body.confirmPassword || "";

    if (!oldPassword)
      return res.status(400).json({ success: false, message: "Please specify Old Password" });
    if (!newPassword)
      return res.status(400).json({ success: false, message: "Please specify New Password" });
    if (!confirmPassword)
      return res.status(400).json({ success: false, message: "Please specify Confirm Password" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({
        success: false,
        message: "'New Password' and 'Confirm New Password' does not match.",
      });

    const oldPasswordValid = await verifyOldPassword(userName, oldPassword, loginType);
    if (!oldPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid Old Password" });
    }

    await updatePassword(userName, newPassword);

    return res
      .status(200)
      .json({ success: true, message: "Password has been changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { submit };