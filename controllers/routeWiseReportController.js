const { getRoutes, getRouteWiseReport } = require("../models/routeWiseReportModel");

const routes = async (req, res) => {
  try {
    const data = await getRoutes();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const report = async (req, res) => {
  try {
    const { route, session } = req.query;
    if (!route) {
      return res.status(400).json({ success: false, message: "Please Specify Route" });
    }

    // TODO: point this at however this app resolves the logged-in user's
    // college(s) — this mirrors frmdebit.GetCollege() in the VB.NET original,
    // which pulled the college list from the logged-in session's context.
    // e.g. const collegeNames = req.user.colleges;
    const collegeNames = req.user?.colleges ?? [];

    const data = await getRouteWiseReport(route, collegeNames, session || undefined);

    if (data.groups.length === 0) {
      return res.status(404).json({ success: false, message: "No Record Found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { routes, report };