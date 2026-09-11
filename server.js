const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db.js");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");

const semesterRoutes = require("./routes/semesterRoutes");
const schemeRoutes = require("./routes/schemeRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const studentActivityFundRoutes = require("./routes/studentActivityFundRoutes");

const masterCourseRoutes = require("./routes/masterCourseRoutes");
const masterAnnualFeeRoutes = require("./routes/masterAnnualFeeRoutes");
const masterCategoryRoutes = require("./routes/masterCategoryRoutes");
const masterHostelBusValidityRoutes = require("./routes/masterHostelBusValidityRoutes");
const masterSchemeRoutes = require("./routes/masterSchemeRoutes");
const studentBasicDetailsRoutes = require("./routes/studentBasicDetailsRoutes");
const feeSingleHeadRoutes = require("./routes/feeSingleHeadRoutes");
const admissionsRoutes = require("./routes/admissionsRoutes");
const admissionFeeRoutes = require("./routes/admissionFeeRoutes");
const dayBookRoutes = require("./routes/dayBookRoutes");
const customSubLedgersRoutes = require("./routes/customSubLedgersRoutes");
const cancelReceiptRoutes = require("./routes/cancelReceiptRoutes");
const deadDebitsRouters = require("./routes/deadDebitsRoutes")
const cancelRestoreRoutes = require("./routes/cancelRestoreRoutes");
const receiptUpdateRoutes = require("./routes/receiptUpdateRoutes");
const facilityRoutes = require("./routes/facilityRoutes");

const app = express();

connectDB();


// CORS configuration
app.use(cors({
  origin: [
    "https://account-frontend-one.vercel.app",
    // "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));




app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);

app.use("/api/semester", semesterRoutes);
app.use("/api/scheme", schemeRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/student-activity-fund", studentActivityFundRoutes);
app.use("/api/student-basic-details", studentBasicDetailsRoutes);
app.use("/api/fee-single-head", feeSingleHeadRoutes);
app.use("/api/feeSingleHead", feeSingleHeadRoutes);

app.use("/api/master-course", masterCourseRoutes);
app.use("/api/master-annual-fee", masterAnnualFeeRoutes);
app.use("/api/master-category", masterCategoryRoutes);
app.use("/api/master-hostel-bus-validity", masterHostelBusValidityRoutes);
app.use("/api/master-scheme", masterSchemeRoutes);
app.use("/api/admissions", admissionsRoutes);
app.use("/api/admission-fee", admissionFeeRoutes);
app.use("/api/custom-sub-ledgers", customSubLedgersRoutes);
app.use("/api/day-book", dayBookRoutes);
app.use("/api/cancel-receipt", cancelReceiptRoutes);
app.use("/api/dead-debits", deadDebitsRouters);
app.use("/api/cancel-restore", cancelRestoreRoutes);
app.use("/api/cancelRestore", cancelRestoreRoutes);
app.use("/api/receipt-update", receiptUpdateRoutes);
app.use("/api/facility", facilityRoutes);
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

module.exports = app;