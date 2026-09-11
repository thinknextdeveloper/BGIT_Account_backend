const reservedReceiptRepository = require("../repositories/reservedReceiptRepository");
const masterHeadRepository = require("../repositories/masterHeadRepository"); // reuse getAssignableColleges

// GET /api/reserved-receipts/ledgers
async function getLedgers(req, res) {
  try {
    const data = await reservedReceiptRepository.getDistinctLedgers();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// GET /api/reserved-receipts/colleges
async function getColleges(req, res) {
  try {
    const data = await masterHeadRepository.getAssignableColleges();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// GET /api/reserved-receipts?session=...&collegeName=... — mirrors DisplayReservedReceiptNumbers
async function getReservedReceipts(req, res) {
  try {
    const { session, collegeName } = req.query;
    if (!session) {
      return res.status(400).json({ success: false, error: { message: "session is required." } });
    }
    const data = await reservedReceiptRepository.listReservedReceipts(session, collegeName);
    res.json({ success: true, data, totalRecords: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// GET /api/reserved-receipts/next-from?collegeName=...&ledgerName=...&session=...
// mirrors cmbCollege_SelectedIndexChanged auto-fill of Receipt No. From
async function getNextReceiptFrom(req, res) {
  try {
    const { collegeName, ledgerName, session } = req.query;
    const receiptFrom = await reservedReceiptRepository.calcNextReceiptFrom(collegeName, ledgerName, session);
    res.json({ success: true, data: { receiptFrom } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

// POST /api/reserved-receipts — mirrors btnSave_Click
async function saveReservedReceipts(req, res) {
  try {
    const { collegeName, session, ledgerName, receiptFrom, noOfReceipts, receiptDate } = req.body;

    if (!collegeName) return res.status(400).json({ success: false, error: { message: "Please select College Name." } });
    if (!ledgerName) return res.status(400).json({ success: false, error: { message: "Please select Ledger Name." } });
    if (!receiptFrom || Number(receiptFrom) === 0)
      return res.status(400).json({ success: false, error: { message: "Please enter Receipt Number From." } });
    if (!noOfReceipts || Number(noOfReceipts) === 0)
      return res.status(400).json({ success: false, error: { message: "Please enter Number of Receipts." } });

    const from = Number(receiptFrom);
    const to = from + Number(noOfReceipts);

    // mirrors IsExistReceiptNo() — check ledger table first, then reserved receipts table
    const conflicts = [];
    for (let i = from; i < to; i++) {
      if (await reservedReceiptRepository.existsInLedger(collegeName, session, ledgerName, i)) {
        conflicts.push(i);
      }
    }
    if (conflicts.length === 0) {
      for (let i = from; i < to; i++) {
        if (await reservedReceiptRepository.existsInReservedReceipts(collegeName, session, ledgerName, i)) {
          conflicts.push(i);
        }
      }
    }
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: `Entered Receipt numbers already exists. Already exists Receipt numbers are: ${conflicts.join(",")}` },
      });
    }

    for (let i = from; i < to; i++) {
      await reservedReceiptRepository.createReservedReceipt({
        collegeName,
        session,
        ledgerName,
        receiptNo: i,
        receiptDate,
      });
    }

    res.json({ success: true, message: "Receipt numbers have Reserved successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

module.exports = { getLedgers, getColleges, getReservedReceipts, getNextReceiptFrom, saveReservedReceipts };