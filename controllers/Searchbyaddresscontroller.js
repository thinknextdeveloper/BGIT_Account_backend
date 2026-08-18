const { searchStudentsByAddress } = require("../models/Searchbyaddressmodel ");

const findByAddress = async (req, res) => {
  try {
    const { address, college, allColleges } = req.query;
    const isAllColleges = allColleges === "true";

    // Same validation order as btnFind_Click: College (unless "All
    // Colleges" is checked) is checked before Address.
    if (!isAllColleges && !college) {
      return res.status(400).json({ success: false, message: "Please specify College" });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "Please Specify Address" });
    }

    // TODO: replace with however this app resolves the logged-in user's
    // privileged college list — mirrors frmdebit.GetCollege().
    const userColleges = req.user?.colleges ?? [];

    const rows = await searchStudentsByAddress({
      address,
      collegeName: college,
      allColleges: isAllColleges,
      userColleges,
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No record found" });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { findByAddress };