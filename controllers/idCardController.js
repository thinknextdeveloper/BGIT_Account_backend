const service = require("../services/idCardService");

function handleError(res, err) {
  if (err instanceof service.AppError) {
    return res.status(err.status).json({ success: false, error: { message: err.message, code: err.code } });
  }
  console.error(err);
  return res.status(500).json({ success: false, error: { message: "Something went wrong" } });
}

// GET /idcard/display?type=IDNo|Registration&idNo=
async function display(req, res) {
  try {
    const { type = "IDNo", idNo } = req.query;
    const data = await service.display({ type, idNo, userId: req.user?.id });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
}

// GET /idcard/valid-upto?college=&batch=&semester=&facility=
async function getValidUpTo(req, res) {
  try {
    const { college, batch, semester, facility } = req.query;
    const data = await service.getValidUpTo({ college, batch, semester, facility });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
}

// POST /idcard/update-card
// body: { type, idNo, mode: 'date'|'text', validUpTo?, validFor?, force? }
async function updateCard(req, res) {
  try {
    const data = await service.updateCard(req.body);
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
}

// POST /idcard/save-image  (multipart: type, idNo + file "image")
async function saveImage(req, res) {
  try {
    const { type, idNo } = req.body;
    const data = await service.saveImage({ type, idNo, buffer: req.file?.buffer });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
}

// GET /idcard/print?type=&idNo=&facility=
async function getPrintPayload(req, res) {
  try {
    const { type = "IDNo", idNo, facility } = req.query;
    const data = await service.getPrintPayload({ type, idNo, facility });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = { display, getValidUpTo, updateCard, saveImage, getPrintPayload };