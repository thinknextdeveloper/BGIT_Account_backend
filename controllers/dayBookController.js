const {
  getColleges,
  getLedgerNames,
  getModesOfPayment,
  getDayBookEntries,
  getCashVsBankTotals,
  getLedgerWiseSummary,
} = require("../models/dayBookModel");

const getDayBookOptions = async (req, res) => {
  try {
    const [colleges, ledgerNames, modesOfPayment] = await Promise.all([
      getColleges(),
      getLedgerNames(),
      getModesOfPayment(),
    ]);

    return res.status(200).json({
      success: true,
      colleges,
      ledgerNames,
      modesOfPayment,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getEntries = async (req, res) => {
  try {
    const {
      collegeName,
      dateFrom,
      dateTo,
      session,
      allSessions,
      ledgerName,
      modeOfPayment,
    } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: "dateFrom and dateTo are required",
      });
    }

    const parsedDateFrom = new Date(dateFrom);
    const parsedDateTo = new Date(dateTo);

    const { rows, totalAmount, count } = await getDayBookEntries({
      collegeName: collegeName || undefined,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
      session: session || undefined,
      allSessions: allSessions === "true",
      ledgerName: ledgerName || undefined,
      modeOfPayment: modeOfPayment || undefined,
    });

    let cashVsBank = null;
    if (collegeName) {
      cashVsBank = await getCashVsBankTotals(collegeName, parsedDateFrom, parsedDateTo);
    }

    return res.status(200).json({
      success: true,
      rows,
      totalAmount,
      count,
      cashVsBank,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getLedgerWise = async (req, res) => {
  try {
    const { collegeName, dateFrom, dateTo } = req.query;

    if (!collegeName || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: "collegeName, dateFrom and dateTo are required",
      });
    }

    const parsedDateFrom = new Date(dateFrom);
    const parsedDateTo = new Date(dateTo);

    const summary = await getLedgerWiseSummary(collegeName, parsedDateFrom, parsedDateTo);
    const cashVsBank = await getCashVsBankTotals(collegeName, parsedDateFrom, parsedDateTo);
    const total = summary.reduce((s, r) => s + (Number(r.Credit) || 0), 0);

    return res.status(200).json({
      success: true,
      summary,
      total,
      cashVsBank,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDayBookOptions, getEntries, getLedgerWise };