const feeSingleHeadRepository = require("../repositories/feeSingleHeadRepository");

function formatDate(val) {
  if (val === null || val === undefined || val === "") return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return String(val);
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatSnap(val) {
  if (val === null || val === undefined) return null;
  if (Buffer.isBuffer(val)) {
    return `data:image/jpeg;base64,${val.toString("base64")}`;
  }
  if (typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) {
    return `data:image/jpeg;base64,${Buffer.from(val.data).toString("base64")}`;
  }
  if (typeof val === "string" && val.trim() !== "") {
    return val.startsWith("data:image") ? val : `data:image/jpeg;base64,${val}`;
  }
  return null;
}

function getRowValue(row, candidateKeys) {
  if (!row) return null;
  for (const k of candidateKeys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  const keys = Object.keys(row);
  for (const k of candidateKeys) {
    const fk = keys.find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (fk && row[fk] !== undefined && row[fk] !== null) return row[fk];
  }
  return null;
}

/**
 * FeeSingleHead Service Layer
 * Business logic converting legacy VB.NET Display(), EntryAlreadyExist(), ShowSession(), and ShowDgvDetail() methods.
 */
class FeeSingleHeadService {
  async getStudentFeeDetails(username, idNo) {
    if (!username) {
      throw new Error("Username is required.");
    }

    // Special handle for CancelRestore displayAllCancellation request
    if (idNo && (String(idNo).toUpperCase() === "CANCELLED" || String(idNo).toUpperCase() === "ALL")) {
      console.log("[FeeSingleHead Service] Fetching cancelled admissions dataset for user:", username);
      const cancRows = await feeSingleHeadRepository.displayAllCancellation(username);
      return {
        studentDetails: null,
        session: "",
        ledgerDetails: [],
        records: cancRows || [],
      };
    }

    // VB.NET Validation: If txtIDNo.Text = "" Then MsgBox("Enter IDNo")
    if (!idNo || String(idNo).trim() === "") {
      throw new Error("Enter IDNo");
    }

    // VB.NET Validation: If IsNumeric(txtIDNo.Text) = False Then MsgBox("Enter Numeric value")
    if (isNaN(Number(String(idNo).trim()))) {
      throw new Error("Enter Numeric value");
    }

    const trimmedIdNo = String(idNo).trim();
    console.log("[FeeSingleHead Service] Processing IDNo:", trimmedIdNo, "for user:", username);

    // Query Admissions by IDNo
    const student = await feeSingleHeadRepository.getStudentByIdNo(trimmedIdNo);
    if (!student) {
      throw new Error("Invalid ID No");
    }

    // Rights Check matching Module1.EntryAlreadyExist(txtStudentDetailCollegeName.Text)
    const collegeName = student.CollegeName || "";
    const hasRights = await feeSingleHeadRepository.entryAlreadyExist(username, collegeName);
    if (!hasRights) {
      throw new Error("This ID No does not belong to your Rights.");
    }

    // Facility conditional mapping matching VB.NET
    let route = "";
    let stopage = "";
    let hostel = "";
    let roomType = "";
    let facilityAmount = 0;

    const facility = student.Facility || "";
    if (facility === "Bus") {
      route = student.BusRoute || "";
      stopage = student.Stopage || "";
      facilityAmount = Number(student.BusFee) || 0;
      hostel = "";
      roomType = "";
    } else if (facility === "Hostel") {
      hostel = student.HostelName || "";
      roomType = student.RoomType || "";
      facilityAmount = Number(student.HostelCharges) || 0;
      route = "";
      stopage = "";
    } else if (facility === "None") {
      hostel = "";
      roomType = "";
      stopage = "";
      route = "";
    }

    // Process Snap photo
    const snap = formatSnap(student.Snap);

    // Fetch CurrentSession matching ShowSession()
    const session = await feeSingleHeadRepository.getShowSession();

    // Fetch Ledger records matching ShowDgvDetail()
    const targetIdForLedger = (student?.IDNo !== undefined && student?.IDNo !== null) ? String(student.IDNo).trim() : trimmedIdNo;
    const ledgerRaw = await feeSingleHeadRepository.getLedgerByIdNo(targetIdForLedger);
    console.log("[FeeSingleHead Service] Raw ledger records count:", ledgerRaw.length);

    let totalDebits = 0;
    let totalCredits = 0;

    const ledgerDetails = ledgerRaw.map((row) => {
      const dateEntryVal = getRowValue(row, ["DateEntry", "Date_Entry", "Date", "TransDate"]);
      const particularsVal = getRowValue(row, ["Particulars", "Particular", "Narration"]);
      const ledgerNameVal = getRowValue(row, ["LedgerName", "Ledger_Name", "Ledger"]);
      const debitVal = getRowValue(row, ["Debit", "DebitAmount", "Dr"]);
      const creditVal = getRowValue(row, ["Credit", "CreditAmount", "Cr"]);

      const debit = Number(debitVal) || 0;
      const credit = Number(creditVal) || 0;
      totalDebits += debit;
      totalCredits += credit;

      return {
        DateEntry: formatDate(dateEntryVal),
        Particulars: String(particularsVal || ""),
        LedgerName: String(ledgerNameVal || ""),
        Debit: debit,
        Credit: credit,
      };
    });

    const totalBalance = totalDebits - totalCredits;
    console.log("[FeeSingleHead Service] Mapped ledgerDetails count:", ledgerDetails.length);
    console.log("[FeeSingleHead Service] Totals -> Debits:", totalDebits, "Credits:", totalCredits, "Balance:", totalBalance);

    return {
      studentDetails: {
        IDNo: student.IDNo,
        StudentType: student.StudentType || "",
        CollegeName: student.CollegeName || "",
        StudentName: student.StudentName || "",
        FatherName: student.FatherName || "",
        Course: student.Course || "",
        Batch: student.Batch || "",
        Class: student.Class || "",
        ClassRollNo: student.ClassRollNo || "",
        UniRollNo: student.UniRollNo || "",
        PermanentAddress: student.PermanentAddress || "",
        Sex: student.Sex || "",
        PhoneNo: student.PhoneNo || "",
        StudentMobileNo: student.StudentMobileNo || "",
        FatherMobileNo: student.FatherMobileNo || "",
        LateralEntry: student.LateralEntry || "",
        Facility: student.Facility || "",
        Route: route,
        Stopage: stopage,
        Hostel: hostel,
        RoomType: roomType,
        FacilityAmount: facilityAmount,
        Scheme: student.Scheme || "",
        Category: student.Category || "",
        ModeAdmission: student.Quota || "",
        Snap: snap,
      },
      session,
      ledgerDetails,
      totalDebits,
      totalCredits,
      totalBalance,
    };
  }

  /**
   * Get distinct BankNames from MasterBank
   */
  async getBanks() {
    return await feeSingleHeadRepository.getBanks();
  }

  /**
   * Add new BankName into MasterBank
   */
  async createBank(bankName) {
    return await feeSingleHeadRepository.createBank(bankName);
  }

  /**
   * Calculate Next Receipt Number matching CalcReceiptNo
   */
  async calcReceiptNo(session) {
    return await feeSingleHeadRepository.calcReceiptNo(session);
  }

  /**
   * Get distinct LedgerNames for a college matching ShowLedgers()
   */
  async getLedgers(username, collegeName) {
    if (!username) {
      throw new Error("Username is required.");
    }
    if (!collegeName || collegeName.trim() === "") {
      throw new Error("College Name is required.");
    }
    const hasRights = await feeSingleHeadRepository.entryAlreadyExist(username, collegeName.trim());
    if (!hasRights) {
      throw new Error("Unauthorized: College Name is not assigned to your account.");
    }

    return await feeSingleHeadRepository.getLedgersByCollege(username, collegeName.trim());
  }

  /**
   * Get distinct Semesters for a college from MasterCourse
   */
  async getSemesters(username, collegeName) {
    if (!username) {
      throw new Error("Username is required.");
    }
    if (!collegeName || collegeName.trim() === "") {
      return [];
    }
    return await feeSingleHeadRepository.getSemestersByCollege(collegeName.trim());
  }

  /**
   * Save Fee Entry matching legacy VB.NET btnSubmit_Click / btnSave_Click / AddDebitEntry()
   */
  async saveFeeEntry(username, payload) {
    if (!username) {
      throw new Error("User authentication required.");
    }
    if (!payload) {
      throw new Error("Invalid request payload.");
    }

    const {
      idNo,
      semester,
      session,
      ledgerType,
      ledgerName,
      onAccountOf,
      paymentMode,
      amount,
      bankName,
      chequeDraftNo,
      chequeDraftDate,
      dateEntry,
      entryType = "Credit",
    } = payload;

    // VB.NET Validations
    if (!idNo || String(idNo).trim() === "") {
      throw new Error("Please Enter IDNo");
    }

    if (!semester || String(semester).trim() === "") {
      throw new Error("Please Select Semester");
    }

    if (!session || String(session).trim() === "") {
      throw new Error("Invalid Session");
    }

    // Determine final LedgerName matching VB logic:
    // If rdbtnBus.Checked = True Then "Bus", ElseIf rdbtnHostel.Checked = True Then "Hostel", ElseIf rdbtnOthers.Checked = True Then cmbLedger.Text
    let finalLedgerName = "";
    if (ledgerType === "Bus") {
      finalLedgerName = "Bus";
    } else if (ledgerType === "Hostel") {
      finalLedgerName = "Hostel";
    } else if (ledgerType === "Others") {
      if (!ledgerName || String(ledgerName).trim() === "") {
        throw new Error("Please Specify Ledger Name");
      }
      finalLedgerName = String(ledgerName).trim();
    } else {
      if (ledgerName && String(ledgerName).trim() !== "") {
        finalLedgerName = String(ledgerName).trim();
      } else {
        throw new Error("Please Select Ledger Name");
      }
    }

    if (!onAccountOf || String(onAccountOf).trim() === "") {
      throw new Error("Please specify On account of");
    }

    if (!paymentMode || String(paymentMode).trim() === "") {
      throw new Error("Please Select Mode Of Payment");
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error("Please Enter Amount Value");
    }

    if (paymentMode === "Cheque") {
      if (!bankName || String(bankName).trim() === "") {
        throw new Error("Please Select Bank Name");
      }
      if (!chequeDraftNo || String(chequeDraftNo).trim() === "") {
        throw new Error("Please Enter Cheque No");
      }
    } else if (paymentMode === "Draft") {
      if (!bankName || String(bankName).trim() === "") {
        throw new Error("Please Select Bank Name");
      }
      if (!chequeDraftNo || String(chequeDraftNo).trim() === "") {
        throw new Error("Please Enter Draft No");
      }
    } else if (paymentMode === "Other" || paymentMode === "Others") {
      if (bankName && String(bankName).trim() !== "" && (!chequeDraftNo || String(chequeDraftNo).trim() === "")) {
        throw new Error("Please Enter Transaction No.");
      }
    }

    // Query Student Admissions Record
    const trimmedIdNo = String(idNo).trim();
    const student = await feeSingleHeadRepository.getStudentByIdNo(trimmedIdNo);
    if (!student) {
      throw new Error("Invalid ID No");
    }

    // Rights Check matching EntryAlreadyExist
    const collegeName = student.CollegeName || "";
    const hasRights = await feeSingleHeadRepository.entryAlreadyExist(username, collegeName);
    if (!hasRights) {
      throw new Error("This ID No does not belong to your Rights.");
    }

    // Compute Next Receipt No & TransactionID
    const receiptNo = await feeSingleHeadRepository.calcReceiptNo(session);
    const transactionId = await feeSingleHeadRepository.genTransactionId(collegeName);
    const semesterId = await feeSingleHeadRepository.getSemesterId(semester);

    // Prepare Dates
    const entryDateVal = dateEntry || new Date();
    const chqDateVal = chequeDraftDate || null;

    const numAmount = Number(amount);
    const isDebit = entryType === "Debit";

    const ledgerEntry = {
      CollegeName: collegeName,
      DateEntry: entryDateVal,
      IDNo: student.IDNo,
      StudentName: student.StudentName,
      FatherName: student.FatherName,
      Course: student.Course,
      Class: student.Class,
      ClassRollNo: student.ClassRollNo,
      Batch: student.Batch,
      Semester: String(semester).trim(),
      SemesterID: semesterId,
      Sex: student.Sex,
      Particulars: String(onAccountOf).trim(),
      LedgerName: finalLedgerName,
      Credit: isDebit ? null : numAmount,
      Debit: isDebit ? numAmount : null,
      TransactionType: isDebit ? "Debit" : "Credit",
      OnAccountOf: String(onAccountOf).trim(),
      ModeOfPayment: String(paymentMode).trim(),
      ChequeDraftDate: chqDateVal,
      ChequeDraftNo: chequeDraftNo ? String(chequeDraftNo).trim() : null,
      ChequeDraftBank: bankName ? String(bankName).trim() : null,
      TransactionID: transactionId,
      Session: String(session).trim(),
      ReceiptNo: receiptNo,
      ReceiptType: "Single",
    };

    await feeSingleHeadRepository.createLedgerEntry(ledgerEntry);

    // Refetch updated student fee details
    const updatedDetails = await this.getStudentFeeDetails(username, trimmedIdNo);

    return {
      success: true,
      message: "Fee entry saved successfully.",
      receiptNo,
      transactionId,
      savedEntry: ledgerEntry,
      updatedDetails,
    };
  }

  /**
   * Search Receipt matching btnPrintPreview_Click VB logic
   */
  async searchReceipt(collegeName, ledgerName, receiptNo, session, searchType = "IDNo") {
    if (!collegeName || String(collegeName).trim() === "") {
      throw new Error("Please Select CollegeName");
    }
    if (!ledgerName || String(ledgerName).trim() === "") {
      throw new Error("Please Select LedgerName");
    }
    if (!receiptNo || String(receiptNo).trim() === "") {
      throw new Error("Please Enter ReceiptNo");
    }

    const result = await feeSingleHeadRepository.searchReceipt(collegeName, ledgerName, receiptNo, session, searchType);
    return result || { receiptType: "Single", records: [] };
  }

  /**
   * Display all cancelled admissions matching DisplayAllCancellation() VB logic
   */
  async displayAllCancellation(username) {
    const rows = await feeSingleHeadRepository.displayAllCancellation(username);
    return {
      records: rows || [],
    };
  }
}

module.exports = new FeeSingleHeadService();
