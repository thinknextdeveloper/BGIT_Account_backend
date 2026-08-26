const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const schemeRoutes = require("./routes/schemeRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
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
const deadDebitsRoutes = require("./routes/deadDebitsRoutes");
const cancelRestoreRoutes = require("./routes/cancelRestoreRoutes");
const receiptUpdateRoutes = require("./routes/receiptUpdateRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const concessionRoutes = require("./routes/concessionRoutes");
const feeReportRoutes = require("./routes/feeReportRoutes");
const hostelReportRoutes = require("./routes/hostelReportRoutes");
const debitRoutes = require("./routes/debitRoutes");
const ledgerStatusRoutes = require("./routes/ledgerStatus");
const routeStopageRoutes = require("./routes/routeStopage");
const routeWiseReportRoutes = require("./routes/routeWiseReport");
const receiptSearchRoutes = require("./routes/receiptSearchRoutes");
const searchByAddressRoutes = require("./routes/searchByAddressRoutes");
const studentActivityFundRoutes = require("./routes/studentActivityFundRoutes");
const pendingRegistrationFeeRoutes = require("./routes/pendingRegistrationFee");
const allSubLedgersPendingFeeRoutes = require("./routes/allSubLedgersPendingFee");
const hostelFacilityReportRoutes = require("./routes/hostelFacilityReport");
const duplicateHostelBusPassRoutes = require("./routes/duplicateHostelBusPass");
const dayBookAllSubLedgersRoutes = require("./routes/dayBookAllSubLedgers");
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    // "https://account-frontend-one.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);

app.use("/api/semester", semesterRoutes);
app.use("/api/scheme", schemeRoutes);
app.use("/api/ledger", ledgerRoutes);

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
app.use("/api/dead-debits", deadDebitsRoutes);

app.use("/api/cancel-restore", cancelRestoreRoutes);
app.use("/api/cancelRestore", cancelRestoreRoutes);
app.use("/api/debit", debitRoutes);
app.use("/api/receipt-update", receiptUpdateRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/concession", concessionRoutes);
app.use("/api/fee-report", feeReportRoutes);
app.use("/api/hostel-report", hostelReportRoutes);
app.use("/api/ledger-status", ledgerStatusRoutes)
app.use("/api/route-stopage", routeStopageRoutes);
app.use("/api/route-wise-report", routeWiseReportRoutes);
app.use("/api/receipt-search", receiptSearchRoutes);
app.use("/api/search-by-address", searchByAddressRoutes);
app.use("/api/student-activity-fund", studentActivityFundRoutes);
app.use("/api/pending-registration-fee", pendingRegistrationFeeRoutes);
app.use("/api/all-sub-ledgers-pending-fee", allSubLedgersPendingFeeRoutes);
app.use("/api/hostel-facility-report", hostelFacilityReportRoutes);
app.use("/api/duplicate-hostel-bus-pass", duplicateHostelBusPassRoutes);
app.use("/api/daybook-all-sub-ledgers", dayBookAllSubLedgersRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running Successfully",
  });
});

const PORT = process.env.PORT || 5000;

// Start server only after DB connection
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect database");
    console.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "production") {
  startServer();
}

module.exports = app;