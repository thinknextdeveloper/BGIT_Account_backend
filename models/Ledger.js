const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    collegeName: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    course: { type: String, required: true, index: true },
    batch: { type: String, index: true },
    semester: { type: String, index: true },
    session: { type: String, index: true },
    feeCategory: { type: String, index: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ledger", ledgerSchema);