const { sql } = require("../config/db");
const semesterRepository = require("./semesterRepository");

function toValidDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const str = String(val).trim();
  if (str === "") return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  const parts = str.split(/[\/\-.]/);
  if (parts.length === 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    let year = p3 < 100 ? 2000 + p3 : p3;
    let month = p2;
    let day = p1;

    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2;
    } else if (p2 > 12 && p1 <= 12) {
      month = p1;
      day = p2;
    }

    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function toYMDString(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const d = toValidDate(val);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateWithoutTime(val) {
  if (!val) return null;
  const d = toValidDate(val);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * FeeSingleHead Repository Layer
 * Interacts with MSSQL Admissions, MasterSession, and Ledger tables.
 */
class FeeSingleHeadRepository {
  /**
   * Fetch Admissions details by IDNo
   */
  async getStudentByIdNo(idNo) {
    const idStr = String(idNo).trim();
    const idNum = isNaN(Number(idStr)) ? 0 : Number(idStr);

    console.log("[FeeSingleHead Repository] Querying Admissions for IDNo:", idStr);

    const request = new sql.Request();
    request.input("IDNoStr", sql.VarChar(100), idStr);
    request.input("IDNoNum", sql.BigInt, idNum);

    const query = `
      SELECT 
        IDNo, StudentType, CollegeName, StudentName, FatherName, Course, Batch, Class, 
        ClassRollNo, UniRollNo, PermanentAddress, Sex, LateralEntry, Facility, 
        BusRoute, Stopage, HostelName, RoomType, BusFee, HostelCharges, Scheme, 
        Category, Quota, Snap, PhoneNo, StudentMobileNo, FatherMobileNo 
      FROM Admissions 
      WHERE LTRIM(RTRIM(CAST(IDNo AS VARCHAR(100)))) = @IDNoStr
         OR IDNo = @IDNoNum
         OR IDNo = TRY_CAST(@IDNoStr AS BIGINT)
         OR IDNo = TRY_CAST(@IDNoStr AS NUMERIC(18,0))
         OR LTRIM(RTRIM(CAST(RegistrationNo AS VARCHAR(100)))) = @IDNoStr
         OR LTRIM(RTRIM(CAST(UniRollNo AS VARCHAR(100)))) = @IDNoStr
         OR LTRIM(RTRIM(CAST(ClassRollNo AS VARCHAR(100)))) = @IDNoStr;
    `;

    const result = await request.query(query);
    if (result.recordset && result.recordset[0]) {
      console.log("[FeeSingleHead Repository] Admissions student found:", true);
      return result.recordset[0];
    }

    // Fallback: Check CancelledAdmission table if student was cancelled
    console.log("[FeeSingleHead Repository] Checking CancelledAdmission fallback for IDNo:", idStr);
    try {
      const fallbackReq = new sql.Request();
      fallbackReq.input("IDNoStr", sql.VarChar(100), idStr);
      fallbackReq.input("IDNoNum", sql.BigInt, idNum);
      const fallbackQuery = `
        SELECT 
          IDNo, StudentType, CollegeName, StudentName, FatherName, Course, Batch, Class, 
          ClassRollNo, UniRollNo, PermanentAddress, Sex, LateralEntry, Facility, 
          BusRoute, Stopage, HostelName, RoomType, BusFee, HostelCharges, Scheme, 
          Category, Quota, Snap, PhoneNo, StudentMobileNo, FatherMobileNo 
        FROM CancelledAdmission 
        WHERE LTRIM(RTRIM(CAST(IDNo AS VARCHAR(100)))) = @IDNoStr
           OR IDNo = @IDNoNum
           OR IDNo = TRY_CAST(@IDNoStr AS BIGINT)
           OR IDNo = TRY_CAST(@IDNoStr AS NUMERIC(18,0))
           OR LTRIM(RTRIM(CAST(RegistrationNo AS VARCHAR(100)))) = @IDNoStr
           OR LTRIM(RTRIM(CAST(UniRollNo AS VARCHAR(100)))) = @IDNoStr
           OR LTRIM(RTRIM(CAST(ClassRollNo AS VARCHAR(100)))) = @IDNoStr;
      `;
      const fallbackResult = await fallbackReq.query(fallbackQuery);
      console.log("[FeeSingleHead Repository] CancelledAdmission student found:", !!fallbackResult.recordset[0]);
      return fallbackResult.recordset[0] || null;
    } catch (fbErr) {
      console.warn("[FeeSingleHead Repository] CancelledAdmission fallback query warning:", fbErr.message);
      return null;
    }
  }

  /**
   * Fetch CurrentSession from MasterSession matching ShowSession() VB logic
   */
  async getShowSession() {
    const request = new sql.Request();
    const query = `
      SELECT TOP 1 CurrentSession 
      FROM MasterSession 
      ORDER BY Session DESC;
    `;

    try {
      const result = await request.query(query);
      return result.recordset[0]?.CurrentSession || "";
    } catch (error) {
      console.warn("Error in getShowSession repository query:", error.message);
      return "";
    }
  }

  /**
   * Fetch Ledger transaction records by IDNo matching ShowDgvDetail() VB logic
   */
  async getLedgerByIdNo(idNo) {
    const idStr = String(idNo).trim();
    const idNum = isNaN(Number(idStr)) ? 0 : Number(idStr);

    console.log("[FeeSingleHead Repository] Querying Ledger for IDNo:", idStr);

    const request = new sql.Request();
    request.input("IDNoStr", sql.VarChar(100), idStr);
    request.input("IDNoNum", sql.BigInt, idNum);

    const query = `
      SELECT DateEntry, Particulars, LedgerName, Debit, Credit 
      FROM Ledger 
      WHERE LTRIM(RTRIM(CAST(IDNo AS VARCHAR(100)))) = @IDNoStr 
         OR IDNo = @IDNoNum
         OR IDNo = TRY_CAST(@IDNoStr AS BIGINT)
         OR IDNo = TRY_CAST(@IDNoStr AS NUMERIC(18,0));
    `;

    const result = await request.query(query);
    console.log("[FeeSingleHead Repository] Ledger recordset returned count:", result.recordset?.length || 0);
    if (result.recordset && result.recordset.length > 0) {
      console.log("[FeeSingleHead Repository] First ledger record sample keys:", Object.keys(result.recordset[0]));
    }
    return result.recordset || [];
  }

  /**
   * Reuse existing EntryAlreadyExist logic from semesterRepository
   */
  async entryAlreadyExist(username, collegeName) {
    return await semesterRepository.entryAlreadyExist(username, collegeName);
  }

  /**
   * Fetch distinct BankNames from MasterBank matching cmbBank_Click VB logic
   */
  async getBanks() {
    const request = new sql.Request();
    const query = `
      SELECT DISTINCT BankName 
      FROM MasterBank 
      WHERE BankName IS NOT NULL AND BankName <> ''
      ORDER BY BankName ASC;
    `;
    try {
      const result = await request.query(query);
      return result.recordset.map((r) => r.BankName);
    } catch (error) {
      console.warn("Error in getBanks repository query:", error.message);
      return [];
    }
  }

  /**
   * Add new BankName into MasterBank matching cmbBank_Click / add bank VB logic
   */
  async createBank(bankName) {
    if (!bankName || String(bankName).trim() === "") {
      throw new Error("Bank Name is required.");
    }
    const cleanBankName = String(bankName).trim();
    const request = new sql.Request();
    request.input("bankName", sql.VarChar(100), cleanBankName);

    const checkQuery = `
      SELECT COUNT(1) AS existingCount 
      FROM MasterBank 
      WHERE BankName = @bankName;
    `;
    const checkResult = await request.query(checkQuery);
    if (checkResult.recordset[0]?.existingCount > 0) {
      return cleanBankName;
    }

    const insertQuery = `
      INSERT INTO MasterBank (BankName) 
      VALUES (@bankName);
    `;
    await request.query(insertQuery);
    return cleanBankName;
  }

  /**
   * Fetch distinct LedgerNames matching GetLedger() VB logic:
   * Selects LedgerNames from MasterLedgers for user's assigned colleges (GetCollege)
   * excluding 'Fee', 'Hostel', and 'Bus'.
   */
  async getLedgersByCollege(username, collegeName) {
    if (!collegeName || String(collegeName).trim() === "") {
      return [];
    }

    const request = new sql.Request();
    request.input("collegeName", sql.VarChar(100), String(collegeName).trim());

    const query = `
      SELECT DISTINCT LedgerName 
      FROM MasterLedgers 
      WHERE CollegeName = @collegeName 
        AND LedgerName IS NOT NULL 
        AND LedgerName <> ''
      ORDER BY LedgerName ASC;
    `;
    try {
      const result = await request.query(query);
      return result.recordset.map((r) => r.LedgerName);
    } catch (error) {
      console.warn("Error in getLedgersByCollege repository query:", error.message);
      return [];
    }
  }

  /**
   * Calculate Next Receipt Number matching CalcReceiptNo VB logic
   */
  async calcReceiptNo(session) {
    if (!session || String(session).trim() === "") {
      return 1;
    }
    const sessionStr = String(session).trim();

    try {
      // 1. Check if any ReceiptNo exists for session
      const req1 = new sql.Request();
      req1.input("session", sql.VarChar(100), sessionStr);
      const res1 = await req1.query(`
        SELECT DISTINCT ReceiptNo 
        FROM Ledger 
        WHERE CAST(Session AS VARCHAR(100)) = @session 
        ORDER BY ReceiptNo DESC;
      `);

      if (!res1.recordset || res1.recordset.length === 0) {
        return 1;
      }

      // 2. Fetch MAX(ReceiptNo)
      const req2 = new sql.Request();
      req2.input("session", sql.VarChar(100), sessionStr);
      const res2 = await req2.query(`
        SELECT MAX(TRY_CAST(ReceiptNo AS INT)) AS MaxReceiptNo 
        FROM Ledger 
        WHERE CAST(Session AS VARCHAR(100)) = @session;
      `);

      let receiptNo = Number(res2.recordset[0]?.MaxReceiptNo);
      if (isNaN(receiptNo) || res2.recordset[0]?.MaxReceiptNo === null) {
        return 1;
      }

      // 3. Check CancelledReceipt table matching VB logic
      let cancelledRows = [];
      try {
        const req3 = new sql.Request();
        req3.input("session", sql.VarChar(100), sessionStr);
        const res3 = await req3.query(`
          SELECT TRY_CAST(ReceiptNo AS INT) AS ReceiptNo 
          FROM CancelledReceipt 
          WHERE CAST(Session AS VARCHAR(100)) = @session 
          ORDER BY ReceiptNo DESC;
        `);
        cancelledRows = res3.recordset || [];
      } catch (cancelErr) {
        console.warn("CancelledReceipt query warning:", cancelErr.message);
      }

      if (cancelledRows.length > 0) {
        for (let i = 0; i < cancelledRows.length; i++) {
          let maxCancelRctno = Number(cancelledRows[i]?.ReceiptNo);
          if (!isNaN(maxCancelRctno) && (maxCancelRctno > receiptNo || maxCancelRctno === receiptNo)) {
            maxCancelRctno = maxCancelRctno + 1;
            receiptNo = maxCancelRctno;
            return receiptNo;
          }
        }
        receiptNo = receiptNo + 1;
      } else {
        receiptNo = receiptNo + 1;
      }

      return receiptNo;
    } catch (error) {
      console.error("Error calculating ReceiptNo:", error.message);
      return 1;
    }
  }

  /**
   * Generate Next TransactionID for a college matching GenTransactionID VB logic
   */
  async genTransactionId(collegeName) {
    if (!collegeName) return 1;
    const request = new sql.Request();
    request.input("collegeName", sql.VarChar(100), collegeName.trim());

    const query = `
      SELECT MAX(TRY_CAST(TransactionID AS INT)) AS MaxTxId 
      FROM Ledger 
      WHERE CollegeName = @collegeName;
    `;

    try {
      const result = await request.query(query);
      const maxTxId = Number(result.recordset[0]?.MaxTxId);
      if (isNaN(maxTxId) || result.recordset[0]?.MaxTxId === null) {
        return 1;
      }
      return maxTxId + 1;
    } catch (error) {
      console.warn("Error in genTransactionId query:", error.message);
      return 1;
    }
  }

  /**
   * Get distinct Semesters for a college from MasterCourse
   */
  async getSemestersByCollege(collegeName) {
    const request = new sql.Request();
    request.input("collegeName", sql.VarChar(100), collegeName || "");

    const query = `
      SELECT DISTINCT Semester, SemesterID 
      FROM MasterCourse 
      WHERE CollegeName = @collegeName AND Semester IS NOT NULL AND Semester <> ''
      ORDER BY SemesterID ASC;
    `;

    try {
      const result = await request.query(query);
      return result.recordset || [];
    } catch (error) {
      console.warn("Error in getSemestersByCollege query:", error.message);
      return [];
    }
  }

  /**
   * Get SemesterID from MasterCourse for a given Semester name
   */
  async getSemesterId(semesterName) {
    if (!semesterName) return 1;
    const request = new sql.Request();
    request.input("semesterName", sql.VarChar(100), String(semesterName).trim());

    const query = `
      SELECT TOP 1 TRY_CAST(SemesterID AS INT) AS SemesterID 
      FROM MasterCourse 
      WHERE Semester = @semesterName;
    `;

    try {
      const result = await request.query(query);
      return Number(result.recordset[0]?.SemesterID) || 1;
    } catch (error) {
      console.warn("Error in getSemesterId query:", error.message);
      return 1;
    }
  }

  /**
   * Insert new entry into Ledger table matching AddDebitEntry() / Save Fee Entry VB logic
   */
/**
   * Insert new entry into Ledger table matching AddDebitEntry() / Save Fee Entry VB logic
   */
  async createLedgerEntry(ledgerEntry) {
    const request = new sql.Request();

    request.input("CollegeName", sql.VarChar(200), ledgerEntry.CollegeName || null);
    request.input("DateEntry", sql.Date, toDateWithoutTime(ledgerEntry.DateEntry));
    request.input("IDNo", sql.VarChar(100), ledgerEntry.IDNo);
    request.input("StudentName", sql.VarChar(200), ledgerEntry.StudentName || null);
    request.input("FatherName", sql.VarChar(200), ledgerEntry.FatherName || null);
    request.input("Course", sql.VarChar(100), ledgerEntry.Course || null);
    request.input("Class", sql.VarChar(100), ledgerEntry.Class || null);
    request.input("ClassRollNo", sql.VarChar(100), ledgerEntry.ClassRollNo || null);
    request.input("UniRollNo", sql.VarChar(100), ledgerEntry.UniRollNo || null);
    request.input("Batch", sql.VarChar(100), ledgerEntry.Batch || null);
    request.input("Semester", sql.VarChar(100), ledgerEntry.Semester);
    request.input("SemesterID", sql.Int, ledgerEntry.SemesterID);
    request.input("FeeCategory", sql.VarChar(100), ledgerEntry.FeeCategory || null);
    request.input("Sex", sql.VarChar(20), ledgerEntry.Sex || null);
    request.input("Particulars", sql.VarChar(500), ledgerEntry.Particulars);
    request.input("LedgerName", sql.VarChar(200), ledgerEntry.LedgerName);
    request.input("Credit", sql.Decimal(18, 2), ledgerEntry.Credit);
    request.input("Debit", sql.Decimal(18, 2), ledgerEntry.Debit);
    request.input("ReceiptNo", sql.Int, ledgerEntry.ReceiptNo);
    request.input("ReceiptType", sql.VarChar(50), ledgerEntry.ReceiptType);
    request.input("TransactionType", sql.VarChar(50), ledgerEntry.TransactionType);
    request.input("OnAccountOf", sql.VarChar(500), ledgerEntry.OnAccountOf);
    request.input("ModeOfPayment", sql.VarChar(50), ledgerEntry.ModeOfPayment);
    request.input("ChequeDraftDate", sql.Date, toDateWithoutTime(ledgerEntry.ChequeDraftDate));
    request.input("ChequeDraftNo", sql.VarChar(100), ledgerEntry.ChequeDraftNo || null);
    request.input("ChequeDraftBank", sql.VarChar(200), ledgerEntry.ChequeDraftBank || null);
    request.input("TransactionID", sql.Int, ledgerEntry.TransactionID);
    request.input("Session", sql.VarChar(50), ledgerEntry.Session);

    const query = `
      INSERT INTO Ledger
        (CollegeName, DateEntry, IDNo, StudentName, FatherName, Course, Class,
         ClassRollNo, UniRollNo, Batch, Semester, SemesterID, FeeCategory, Sex,
         Particulars, LedgerName, Credit, Debit, ReceiptNo, ReceiptType,
         TransactionType, OnAccountOf, ModeOfPayment, ChequeDraftDate,
         ChequeDraftNo, ChequeDraftBank, TransactionID, Session)
      VALUES
        (@CollegeName, @DateEntry, @IDNo, @StudentName, @FatherName, @Course, @Class,
         @ClassRollNo, @UniRollNo, @Batch, @Semester, @SemesterID, @FeeCategory, @Sex,
         @Particulars, @LedgerName, @Credit, @Debit, @ReceiptNo, @ReceiptType,
         @TransactionType, @OnAccountOf, @ModeOfPayment, @ChequeDraftDate,
         @ChequeDraftNo, @ChequeDraftBank, @TransactionID, @Session);
    `;

    try {
      const result = await request.query(query);
      console.log("[FeeSingleHead Repository] Ledger entry inserted, rowsAffected:", result.rowsAffected);
      return result;
    } catch (error) {
      console.error("Error in createLedgerEntry query:", error.message);
      throw error;
    }
  }

  /**
   * Search Receipt matching btnPrintPreview_Click VB.NET logic
   */
  async searchReceipt(collegeName, ledgerName, receiptNo, session, searchType = "IDNo") {
    const cleanCollege = String(collegeName || "").trim();
    const cleanLedger = String(ledgerName || "").trim();
    const cleanReceiptStr = String(receiptNo || "").trim();
    const cleanReceiptNum = isNaN(Number(cleanReceiptStr)) ? 0 : Number(cleanReceiptStr);
    const cleanSession = String(session || "").trim();
    const isRegistration = searchType === "Registration";

    console.log("[FeeSingleHead Repository] searchReceipt parameters:", {
      cleanCollege,
      cleanLedger,
      cleanReceiptStr,
      cleanReceiptNum,
      cleanSession,
      searchType,
    });

    // 1. Check ReceiptType matching exact VB query:
    // sql = "select ReceiptType from Ledger where CollegeName='" & cmbCollege.Text & "' And LedgerName='" & cmbLedgerName.Text & "' And ReceiptNo=" & txtReceiptNo.Text & " And Session='" & txtSession.Text & "'"
    let receiptType = null;
    try {
      const typeReq = new sql.Request();
      typeReq.input("collegeName", sql.VarChar(100), cleanCollege);
      typeReq.input("ledgerName", sql.VarChar(100), cleanLedger);
      typeReq.input("receiptNoNum", sql.Int, cleanReceiptNum);
      typeReq.input("receiptNoStr", sql.VarChar(100), cleanReceiptStr);
      typeReq.input("session", sql.VarChar(100), cleanSession);

      const typeQuery = `
        SELECT ReceiptType 
        FROM Ledger 
        WHERE CollegeName = @collegeName 
          AND LedgerName = @ledgerName 
          AND (ReceiptNo = @receiptNoNum OR LTRIM(RTRIM(CAST(ReceiptNo AS VARCHAR(100)))) = @receiptNoStr) 
          AND Session = @session;
      `;
      const typeRes = await typeReq.query(typeQuery);
      if (typeRes.recordset && typeRes.recordset.length > 0) {
        receiptType = typeRes.recordset[0].ReceiptType || "Single";
      } else {
        // Strict match: no record for exact CollegeName, LedgerName, ReceiptNo & Session
        return { receiptType: "Single", records: [] };
      }
    } catch (e) {
      console.warn("ReceiptType check query warning:", e.message);
      return { receiptType: "Single", records: [] };
    }

    const dataReq = new sql.Request();
    dataReq.input("collegeName", sql.VarChar(100), cleanCollege);
    dataReq.input("ledgerName", sql.VarChar(100), cleanLedger);
    dataReq.input("receiptNoNum", sql.Int, cleanReceiptNum);
    dataReq.input("receiptNoStr", sql.VarChar(100), cleanReceiptStr);
    dataReq.input("session", sql.VarChar(100), cleanSession);

    // 2. Query Multiple matching exact VB query sql1:
    if (receiptType === "Multiple") {
      const sql1 = isRegistration
        ? `Select Ledger.CollegeName,Ledger.StudentName,Ledger.FatherName,Ledger.Sex,Ledger.ReceiptNo,Ledger.DateEntry,Ledger.RegistrationNo,Ledger.Course,Ledger.Batch,Ledger.Semester,Ledger.OnAccountof,Ledger.ChequeDraftBank,Ledger.ChequeDraftNo,Ledger.ChequeDraftDate,Ledger.ModeOfPayment,Ledger.Credit as Credit1,SubLedgers.Subhead,SubLedgers.Credit from Ledger,SubLedgers Where Ledger.CollegeName=SubLedgers.CollegeName and Ledger.LedgerName=SubLedgers.LedgerName and Ledger.Session=SubLedgers.Session And Ledger.ReceiptNo = SubLedgers.ReceiptNo and Ledger.CollegeName=@collegeName And Ledger.LedgerName=@ledgerName And (Ledger.ReceiptNo=@receiptNoNum OR LTRIM(RTRIM(CAST(Ledger.ReceiptNo AS VARCHAR(100))))=@receiptNoStr) And Ledger.ReceiptType='Multiple' And Ledger.Session=@session`
        : `Select Ledger.CollegeName,Ledger.ClassRollNo,Ledger.UniRollNo,Ledger.StudentName,Ledger.FatherName,Ledger.Sex,Ledger.ReceiptNo,Ledger.DateEntry,Ledger.IDNo,Ledger.Course,Ledger.Batch,Ledger.Semester,Ledger.OnAccountof,Ledger.ChequeDraftBank,Ledger.ChequeDraftNo,Ledger.ChequeDraftDate,Ledger.ModeOfPayment,Ledger.Credit as Credit1,SubLedgers.Subhead,SubLedgers.Credit from Ledger,SubLedgers Where Ledger.CollegeName=SubLedgers.CollegeName and Ledger.LedgerName=SubLedgers.LedgerName and Ledger.Session=SubLedgers.Session And Ledger.ReceiptNo = SubLedgers.ReceiptNo and Ledger.CollegeName=@collegeName And Ledger.LedgerName=@ledgerName And (Ledger.ReceiptNo=@receiptNoNum OR LTRIM(RTRIM(CAST(Ledger.ReceiptNo AS VARCHAR(100))))=@receiptNoStr) And Ledger.ReceiptType='Multiple' And Ledger.Session=@session`;

      try {
        const res = await dataReq.query(sql1);
        if (res.recordset && res.recordset.length > 0) {
          console.log("[FeeSingleHead Repository] Multiple receipt found, count:", res.recordset.length);
          return { receiptType: "Multiple", records: res.recordset };
        } else {
          return { receiptType: "Multiple", records: [] };
        }
      } catch (e) {
        console.warn("Multiple receipt query error:", e.message);
        return { receiptType: "Multiple", records: [] };
      }
    }

    // 3. Query Single matching exact VB query sql2:
    const sql2 = isRegistration
      ? `Select CollegeName,DateEntry,RegistrationNo,Course,Batch,StudentName,FatherName,Semester,Sex,ReceiptNo,LedgerName,Particulars,OnAccountOf,Credit,Debit,ChequeDraftNo,ChequeDraftDate,ChequeDraftBank,ModeOfPayment,TransactionType from Ledger where CollegeName=@collegeName And LedgerName=@ledgerName And (ReceiptNo=@receiptNoNum OR LTRIM(RTRIM(CAST(ReceiptNo AS VARCHAR(100))))=@receiptNoStr) And ReceiptType='Single' And Session=@session`
      : `Select CollegeName,DateEntry,IDNo,Course,Batch,ClassRollNo,StudentName,FatherName,Semester,Sex,ReceiptNo,LedgerName,Particulars,OnAccountOf,Credit,Debit,ChequeDraftNo,ChequeDraftDate,ChequeDraftBank,ModeOfPayment,TransactionType from Ledger where CollegeName=@collegeName And LedgerName=@ledgerName And (ReceiptNo=@receiptNoNum OR LTRIM(RTRIM(CAST(ReceiptNo AS VARCHAR(100))))=@receiptNoStr) And ReceiptType='Single' And Session=@session`;

    try {
      const res = await dataReq.query(sql2);
      console.log("[FeeSingleHead Repository] Single receipt query returned count:", res.recordset?.length || 0);

      return {
        receiptType: "Single",
        records: res.recordset || [],
      };
    } catch (e) {
      console.error("Single receipt query error:", e.message);
      return { receiptType: "Single", records: [] };
    }
  }

  /**
   * Fetch all cancelled admission details matching DisplayAllCancellation(), GetCollege(), and GetAssignedCollegeName1() VB query
   */
  async displayAllCancellation(username) {
    console.log("------------------------------------------");
    console.log("📌 Logged-in Username (FeeSingleHead Repository):", username);
    console.log("------------------------------------------");

    const pool = await getPool();

    // Step 1: Function GetAssignedCollegeName1()
    let assignedColleges = [];
    try {
      const userReq = pool.request();
      userReq.input("username", sql.VarChar(100), username || "");
      const userRes = await userReq.query(`
        SELECT DISTINCT CollegeName 
        FROM UserMaster 
        WHERE UserName = @username AND CollegeName IS NOT NULL AND CollegeName <> '';
      `);
      assignedColleges = userRes.recordset?.map((r) => r.CollegeName).filter(Boolean) || [];
      console.log("📌 Assigned Colleges (UserMaster):", assignedColleges);
    } catch (e) {
      console.warn("GetAssignedCollegeName1 error:", e.message);
    }

    // Step 2: Function GetCollege()
    let matchedColleges = assignedColleges;
    if (assignedColleges.length > 0) {
      try {
        const courseReq = pool.request();
        const inClause = assignedColleges.map((_, i) => `@c${i}`).join(",");
        assignedColleges.forEach((c, i) => courseReq.input(`c${i}`, sql.VarChar(200), c));

        const courseRes = await courseReq.query(`
          SELECT DISTINCT CollegeName 
          FROM MasterCourse 
          WHERE CollegeName IN (${inClause})
          ORDER BY CollegeName;
        `);
        const fetched = courseRes.recordset?.map((r) => r.CollegeName).filter(Boolean) || [];
        if (fetched.length > 0) {
          matchedColleges = fetched;
        }
        console.log("📌 Matched Colleges (GetCollege):", matchedColleges);
      } catch (e) {
        console.warn("GetCollege error:", e.message);
      }
    }

    // Step 3: Sub DisplayAllCancellation()
    const mainReq = pool.request();
    let selectQuery = `
      SELECT 
        CancellationDate, CancelStatus, Reason, ShiftedFrom, ShiftedTo, CollegeName, Course, Class, Batch, 
        Section, ClassRollNo, LateralEntry, AdmissionDate, IDNo, StudentName, Sex, FatherName, MotherName, DOB, 
        FatherOccupation, MotherOccupation, FatherDesignation, FatherEmailID, CorrespondanceAddress, 
        PermanentAddress, EmailID, PhoneNo, StudentMobileNo, FatherMobileNo, MotherMobileNo, Facility, BusRoute, 
        RouteID, Stopage, StopageID, HostelName, RoomType, HostelCharges, BusFee, StudentType, Concession, 
        ConcessionDetails, ConcessionPerc, ConcessionTotalAmount, BloodGroup, Category, Locality, Medium, 
        Quota, FeeWaiverScheme, FirstPreference, SecondPreference, ThirdPreference, FourthPreference, Scheme, 
        InstitutionLastAttended, University, State, Religion, SeatConfirmed, City, BoardRegistrationNo, 
        ConcessionReferenceLetterNo, Village, VPO, PO, Tehsil, District, GuardianAddress, GuardianContactNo, 
        Nationality, PreviousMedicalIllness, OtherEntranceTest, NSS, Sports, OtherAchievements, GroupName, 
        UniRollNo, UserID, EnquiryNo, EnquiryDate, RegistrationNo, RegistrationDate, Snap, CardIssued, 
        CardIssuedDate, ValidUpTo, LastExam, Board, LastExamPerc, Newspaper, ThirdPerson, CableTV, Student, 
        StaffMember, FlexBoard, Pamphlet, Comments, ThirdPersonName, ThirdPersonDesignation, ThirdPersonAddress, 
        ThirdPersonContactNo, CableTVChannel, ReferenceStudentClass, StaffMemberName, StaffMemberDesignation, 
        NewspaperName, CommentsDetail, Locked, SmartCardIssued, SmartCardIssuedDate, EntranceTest1, 
        EntranceTest1RollNo, EntranceTest1Rank, EntranceTest2, EntranceTest2RollNo, EntranceTest2Rank 
      FROM CancelledAdmission
    `;

    if (matchedColleges.length > 0) {
      const mainInClause = matchedColleges.map((_, i) => `@m${i}`).join(",");
      matchedColleges.forEach((c, i) => mainReq.input(`m${i}`, sql.VarChar(200), c));
      selectQuery += ` WHERE CollegeName IN (${mainInClause})`;
    }

    try {
      const mainRes = await mainReq.query(selectQuery);
      console.log("[FeeSingleHead Repository] CancelledAdmission count:", mainRes.recordset?.length || 0);

      if (!mainRes.recordset || mainRes.recordset.length === 0) {
        // Fallback: Return all rows from CancelledAdmission if specific college filter returns empty
        const fbRes = await pool.request().query(`
          SELECT 
            CancellationDate, CancelStatus, Reason, ShiftedFrom, ShiftedTo, CollegeName, Course, Class, Batch, 
            Section, ClassRollNo, LateralEntry, AdmissionDate, IDNo, StudentName, Sex, FatherName, MotherName, DOB, 
            FatherOccupation, MotherOccupation, FatherDesignation, FatherEmailID, CorrespondanceAddress, 
            PermanentAddress, EmailID, PhoneNo, StudentMobileNo, FatherMobileNo, MotherMobileNo, Facility, BusRoute, 
            RouteID, Stopage, StopageID, HostelName, RoomType, HostelCharges, BusFee, StudentType, Concession, 
            ConcessionDetails, ConcessionPerc, ConcessionTotalAmount, BloodGroup, Category, Locality, Medium, 
            Quota, FeeWaiverScheme, FirstPreference, SecondPreference, ThirdPreference, FourthPreference, Scheme, 
            InstitutionLastAttended, University, State, Religion, SeatConfirmed, City, BoardRegistrationNo, 
            ConcessionReferenceLetterNo, Village, VPO, PO, Tehsil, District, GuardianAddress, GuardianContactNo, 
            Nationality, PreviousMedicalIllness, OtherEntranceTest, NSS, Sports, OtherAchievements, GroupName, 
            UniRollNo, UserID, EnquiryNo, EnquiryDate, RegistrationNo, RegistrationDate, Snap, CardIssued, 
            CardIssuedDate, ValidUpTo, LastExam, Board, LastExamPerc, Newspaper, ThirdPerson, CableTV, Student, 
            StaffMember, FlexBoard, Pamphlet, Comments, ThirdPersonName, ThirdPersonDesignation, ThirdPersonAddress, 
            ThirdPersonContactNo, CableTVChannel, ReferenceStudentClass, StaffMemberName, StaffMemberDesignation, 
            NewspaperName, CommentsDetail, Locked, SmartCardIssued, SmartCardIssuedDate, EntranceTest1, 
            EntranceTest1RollNo, EntranceTest1Rank, EntranceTest2, EntranceTest2RollNo, EntranceTest2Rank 
          FROM CancelledAdmission;
        `);
        console.log("[FeeSingleHead Repository] Fallback CancelledAdmission count:", fbRes.recordset?.length || 0);
        return fbRes.recordset || [];
      }

      return mainRes.recordset || [];
    } catch (err) {
      console.warn("CancelledAdmission query error:", err.message);
      return [];
    }
  }
}

module.exports = new FeeSingleHeadRepository();
