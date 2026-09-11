const { searchStopage } = require("../models/searchStopageModel");

const findStopage = async (req, res) => {
  try {
    const { stopage, term } = req.query;
    const searchTerm = stopage || term;

    console.log("📥 [Controller] SearchStopage Query Params:", {
      query: req.query,
      searchTerm,
    });

    if (!searchTerm || String(searchTerm).trim() === "") {
      return res.status(400).json({ success: false, message: "Please enter stopage" });
    }

    const userColleges = req.user?.colleges ?? [];

    const rows = await searchStopage({
      stopage: searchTerm,
      userColleges,
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Sorry No record found", data: [] });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("searchStopage error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { findStopage };
