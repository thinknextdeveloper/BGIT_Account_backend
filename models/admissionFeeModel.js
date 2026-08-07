const { sql, getPool } = require("../config/db");
const getFeeHeadsByIdNo = async (idNo, session, ledgerName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.VarChar, String(idNo))
    .input("Session", sql.VarChar, String(session))
    .input("LedgerName", sql.VarChar, String(ledgerName))
    .query(`
        SELECT *
        FROM FeeHeads
        WHERE TRY_CAST(IDNo AS BIGINT) = TRY_CAST(@IDNo AS BIGINT)
          AND Session = @Session
          AND LedgerName = @LedgerName
    `);
  return result.recordset;
};

const getStudentById = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .query(`
        SELECT
            IDNo, StudentType, CollegeName, StudentName, FatherName,
            Course, Batch, Class, Session, ClassRollNo, UniRollNo,
            PermanentAddress, Sex, LateralEntry, Facility, BusRoute,
            BusFee, Stopage, HostelName, RoomType, HostelCharges,
            Scheme, Category, Quota, Snap
        FROM Admissions
        WHERE IDNo=@IDNo
    `);
  return result.recordset[0];
};

const getLedger = async (idNo) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .query(`
        SELECT DateEntry, Particulars, LedgerName, Debit, Credit
        FROM Ledger
        WHERE IDNo=@IDNo
        ORDER BY DateEntry DESC
    `);
  return result.recordset;
};

// Legacy raw dump (kept for backwards compatibility / debugging) — this is
// NOT what the Fee grid should use anymore, use getFeeStructureWithBalances
// instead. LedgerName on SubLedgers rows is always "Fee"/"Bus" here, so this
// does not give per-head breakdown.

const getFeeHeads = async (req, res) => {
  try {
    const { idNo, session, ledgerName } = req.query;

    if (!idNo || !session || !ledgerName) {
      return res.status(400).json({
        success: false,
        message: "idNo, session, and ledgerName are required",
      });
    }

    const feeHeads = await getFeeHeadsByIdNo(idNo, session, ledgerName);

    return res.status(200).json({ success: true, feeHeads });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Generates the next Fee receipt no. for a college/session,
// mirrors Module1.CalcReceiptNo in the VB code
const calcReceiptNo = async (collegeName, ledgerName, session, transaction) => {
  if (!session || String(session).trim() === "") {
    return 1;
  }
  const sessionStr = String(session).trim();

  const req1 = transaction
    ? transaction.request()
    : (await getPool()).request();
  req1.input("Session", sql.NVarChar, sessionStr);
  const res1 = await req1.query(`
    SELECT DISTINCT ReceiptNo
    FROM Ledger
    WHERE CAST(Session AS VARCHAR(100)) = @Session
    ORDER BY ReceiptNo DESC
  `);

  if (!res1.recordset || res1.recordset.length === 0) {
    return 1;
  }

  const req2 = transaction
    ? transaction.request()
    : (await getPool()).request();
  req2.input("Session", sql.NVarChar, sessionStr);
  const res2 = await req2.query(`
    SELECT MAX(TRY_CAST(ReceiptNo AS INT)) AS MaxReceiptNo
    FROM Ledger
    WHERE CAST(Session AS VARCHAR(100)) = @Session
  `);

  let receiptNo = Number(res2.recordset[0]?.MaxReceiptNo);
  if (isNaN(receiptNo) || res2.recordset[0]?.MaxReceiptNo === null || res2.recordset[0]?.MaxReceiptNo === undefined) {
    return 1;
  }

  let cancelledRows = [];
  try {
    const req3 = transaction
      ? transaction.request()
      : (await getPool()).request();
    req3.input("Session", sql.NVarChar, sessionStr);
    const res3 = await req3.query(`
      SELECT TRY_CAST(ReceiptNo AS INT) AS ReceiptNo
      FROM CancelledReceipt
      WHERE CAST(Session AS VARCHAR(100)) = @Session
      ORDER BY ReceiptNo DESC
    `);
    cancelledRows = res3.recordset || [];
  } catch (cancelErr) {
    console.warn("CancelledReceipt query warning:", cancelErr.message);
  }

  if (cancelledRows.length > 0) {
    for (let i = 0; i < cancelledRows.length; i++) {
      let maxCancelRctno = Number(cancelledRows[i]?.ReceiptNo);
      if (!isNaN(maxCancelRctno) && (maxCancelRctno >= receiptNo)) {
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
};

// Generates a fresh TransactionID scoped to the college,
// mirrors Module1.GenTransactionID
const genTransactionId = async (collegeName, transaction) => {
  const request = transaction
    ? transaction.request()
    : (await getPool()).request();

  const result = await request
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`
        SELECT MAX(TransactionID) AS MaxTxnID
        FROM Ledger
        WHERE CollegeName=@CollegeName
    `);

  const raw = result.recordset[0]?.MaxTxnID;
  const max = raw !== null && raw !== undefined ? Number(raw) : 0;
  return max + 1; // now guaranteed numeric addition
};

/**
 * Saves a fee entry: one row in Ledger (the overall receipt/credit line)
 * plus one row per fee head in SubLedgers (so getFeeStructureWithBalances
 * can attribute amounts back to individual heads like Academic Fee / Bus
 * Fee / etc.). Mirrors VB's btnSave_Click.
 *
 * FIX: removed "DayBookDateEntry" — that column does not exist on the
 * Ledger table (that's what caused: "Invalid column name
 * 'DayBookDateEntry'" on Save and Print). DateEntry alone covers what the
 * VB code wrote via @DateEntry.
 */
const saveFeeEntry = async (payload) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      idNo,
      collegeName,
      studentName,
      fatherName,
      course,
      studentClass,
      batch,
      classRollNo,
      uniRollNo,
      semester,
      scheme,
      category,
      modeOfAdmission,
      sex,
      onAccountOf,
      totalCredit,
      modeOfPayment, // "Cash" | "Cheque" | "Draft" | "Bank Transfer"
      chequeDraftDate,
      chequeDraftNo,
      chequeDraftBank,
      session,
      userId,
      dateEntry, // JS Date or ISO string
      feeHeads, // [{ head: "Academic Fee", credit: 30100 }, ...] — only rows with credit > 0
    } = payload;

    const receiptNo = await calcReceiptNo(collegeName, "Fee", session, transaction);
    const transactionId = await genTransactionId(collegeName, transaction);

    const ledgerRequest = transaction.request();
    ledgerRequest
      .input("CollegeName", sql.NVarChar, collegeName)
      .input("DateEntry", sql.DateTime, dateEntry)
      .input("IDNo", sql.BigInt, idNo)
      .input("StudentName", sql.NVarChar, studentName)
      .input("FatherName", sql.NVarChar, fatherName)
      .input("Course", sql.NVarChar, course)
      .input("Class", sql.NVarChar, studentClass)
      .input("Batch", sql.Int, batch)
      .input("ClassRollNo", sql.NVarChar, classRollNo || null)
      .input("UniRollNo", sql.NVarChar, uniRollNo || null)
      .input("Semester", sql.NVarChar, semester)
      .input("Scheme", sql.NVarChar, scheme || null)
      .input("Category", sql.NVarChar, category || null)
      .input("ModeOfAdmission", sql.NVarChar, modeOfAdmission || null)
      .input("Sex", sql.NVarChar, sex)
      .input("Particulars", sql.NVarChar, `${onAccountOf} by Receipt No.${receiptNo}`)
      .input("LedgerName", sql.NVarChar, "Fee")
      .input("Credit", sql.Decimal(18, 2), totalCredit)
      .input("ReceiptNo", sql.Int, receiptNo)
      .input("ReceiptType", sql.NVarChar, "Multiple")
      .input("TransactionType", sql.NVarChar, "Credit")
      .input("OnAccountOf", sql.NVarChar, onAccountOf)
      .input("ModeOfPayment", sql.NVarChar, modeOfPayment)
      .input("ChequeDraftDate", sql.DateTime, modeOfPayment !== "Cash" ? chequeDraftDate : null)
      .input("ChequeDraftNo", sql.NVarChar, modeOfPayment !== "Cash" ? chequeDraftNo : null)
      .input("ChequeDraftBank", sql.NVarChar, modeOfPayment !== "Cash" ? chequeDraftBank : null)
      .input("TransactionID", sql.BigInt, transactionId)
      .input("Session", sql.NVarChar, session || null)
      .input("UserID", sql.NVarChar, userId || null);

    await ledgerRequest.query(`
      INSERT INTO Ledger
        (CollegeName, DateEntry, IDNo, StudentName, FatherName,
         Course, Class, Batch, ClassRollNo, UniRollNo, Semester, Scheme, Category,
         ModeOfAdmission, Sex, Particulars, LedgerName, Credit, ReceiptNo,
         ReceiptType, TransactionType, OnAccountOf, ModeOfPayment,
         ChequeDraftDate, ChequeDraftNo, ChequeDraftBank, TransactionID, Session, UserID)
      VALUES
        (@CollegeName, @DateEntry, @IDNo, @StudentName, @FatherName,
         @Course, @Class, @Batch, @ClassRollNo, @UniRollNo, @Semester, @Scheme, @Category,
         @ModeOfAdmission, @Sex, @Particulars, @LedgerName, @Credit, @ReceiptNo,
         @ReceiptType, @TransactionType, @OnAccountOf, @ModeOfPayment,
         @ChequeDraftDate, @ChequeDraftNo, @ChequeDraftBank, @TransactionID, @Session, @UserID)
    `);

    for (const row of feeHeads || []) {
      if (!row.credit) continue;
      const subRequest = transaction.request();
      subRequest
        .input("Session", sql.NVarChar, session || null)
        .input("CollegeName", sql.NVarChar, collegeName)
        .input("TransactionType", sql.NVarChar, "Credit")
        .input("TransactionID", sql.BigInt, transactionId)
        .input("LedgerName", sql.NVarChar, "Fee")
        .input("ReceiptNo", sql.Int, receiptNo)
        .input("Subhead", sql.NVarChar, row.head)
        .input("Credit", sql.Decimal(18, 2), row.credit)
        .input("UserID", sql.NVarChar, userId || null);

      await subRequest.query(`
        INSERT INTO SubLedgers
          (Session, CollegeName, TransactionType, TransactionID, LedgerName, ReceiptNo, Subhead, Credit, UserID)
        VALUES
          (@Session, @CollegeName, @TransactionType, @TransactionID, @LedgerName, @ReceiptNo, @Subhead, @Credit, @UserID)
      `);
    }

    await transaction.commit();

    return { receiptNo, transactionId };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const getSchemes = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT Scheme FROM MasterScheme WHERE CollegeName=@CollegeName`);
  return result.recordset.map((r) => r.Scheme);
};

const getCategories = async (collegeName) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .query(`SELECT DISTINCT Category FROM MasterCategory WHERE CollegeName=@CollegeName`);
  return result.recordset.map((r) => r.Category);
};

const getModesOfAdmission = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT DISTINCT ModeOfAdmission FROM MasterModeAdmission`);
  return result.recordset.map((r) => r.ModeOfAdmission);
};

const updateStudentAdmissionMeta = async (idNo, { scheme, category, quota }) => {
  const pool = await getPool();
  await pool
    .request()
    .input("IDNo", sql.BigInt, idNo)
    .input("Scheme", sql.NVarChar, scheme || null)
    .input("Category", sql.NVarChar, category || null)
    .input("Quota", sql.NVarChar, quota || null)
    .query(`
      UPDATE Admissions
      SET Scheme=@Scheme, Category=@Category, Quota=@Quota
      WHERE IDNo=@IDNo
    `);
};

/**
 * Mirrors VB Module1.ShowCurSemester(): looks up the currently active
 * semester for a College + Course (+ Batch, if provided) from
 * MasterCurrentSemester. Used to auto-populate cmbSemester right after
 * Display() populates the student's college/course/batch fields, so the
 * person doesn't have to manually pick a semester on every Find.
 */
const getCurrentSemester = async (collegeName, course, batch) => {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT TOP 1 Semester FROM MasterCurrentSemester
    WHERE CollegeName = @CollegeName AND Course = @Course
  `;
  request.input("CollegeName", sql.NVarChar, collegeName);
  request.input("Course", sql.NVarChar, course);

  if (batch) {
    query += ` AND Batch = @Batch`;
    request.input("Batch", sql.Int, batch);
  }

  const result = await request.query(query);
  return result.recordset[0]?.Semester || null;
};

/**
 * Builds the Fee-grid rows the way VB's Display()/ShowDebits()/
 * BalanceHeadAmount() pipeline does:
 *   1. Get the configured head list + amount owed from MasterHeads /
 *      MasterAnnualFee, scoped by course/batch/semester/scheme/category/
 *      modeOfAdmission.
 *   2. Get how much has already been paid per head from SubLedgers,
 *      scoped by student/semester/session.
 *   3. Merge the two so the frontend gets {Head, Debit, Credit,
 *      BalanceHeadWise, Concession} per row — exactly what dgvHeads showed.
 */
const getFeeStructureWithBalances = async ({
  idNo,
  collegeName,
  course,
  batch,
  semester,
  scheme,
  category,
  modeOfAdmission,
  session,
}) => {
  const pool = await getPool();

  // 1. Head list + amount owed (MasterHeads / MasterAnnualFee)
  const headsResult = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("Course", sql.NVarChar, course)
    .input("Batch", sql.Int, batch)
    .input("Semester", sql.NVarChar, semester)
    .input("Scheme", sql.NVarChar, scheme)
    .input("Category", sql.NVarChar, category)
    .input("ModeOfAdmission", sql.NVarChar, modeOfAdmission)
    .query(`
      SELECT DISTINCT MasterHeads.Head, MasterAnnualFee.Amount AS Debit, MasterHeads.ID
      FROM MasterHeads
      LEFT JOIN MasterAnnualFee
        ON MasterHeads.CollegeName = MasterAnnualFee.CollegeName
       AND MasterHeads.Head = MasterAnnualFee.Head
       AND MasterAnnualFee.CollegeName = @CollegeName
       AND MasterAnnualFee.Course = @Course
       AND MasterAnnualFee.Batch = @Batch
       AND MasterAnnualFee.Semester = @Semester
       AND MasterAnnualFee.Scheme = @Scheme
       AND MasterAnnualFee.Category = @Category
       AND MasterAnnualFee.ModeOfAdmission = @ModeOfAdmission
      WHERE MasterHeads.CollegeName = @CollegeName
      ORDER BY MasterHeads.ID
    `);

  const heads = headsResult.recordset;
  if (heads.length === 0) return [];

  // 2. Balance already paid per head (VB looped BalanceHeadAmount() per
  //    row — we do it as a single GROUP BY instead)
  const balanceResult = await pool
    .request()
    .input("CollegeName", sql.NVarChar, collegeName)
    .input("IDNo", sql.BigInt, idNo)
    .input("Semester", sql.NVarChar, semester)
    .input("Session", sql.NVarChar, session)
    .query(`
      SELECT SubLedgers.SubHead,
             SUM(CASE WHEN SubLedgers.TransactionType = 'Credit' THEN SubLedgers.Credit ELSE 0 END) AS Credit1,
             SUM(CASE WHEN SubLedgers.TransactionType = 'Debit'  THEN SubLedgers.Debit  ELSE 0 END) AS Debit1
      FROM SubLedgers
      LEFT OUTER JOIN Ledger
        ON Ledger.CollegeName = SubLedgers.CollegeName
       AND Ledger.TransactionID = SubLedgers.TransactionID
       AND Ledger.LedgerName = SubLedgers.LedgerName
      WHERE SubLedgers.CollegeName = @CollegeName
        AND Ledger.IDNo = @IDNo
        AND Ledger.Semester = @Semester
        AND Ledger.LedgerName = 'Fee'
        AND SubLedgers.Session = @Session
        AND Ledger.ReceiptType = 'Multiple'
      GROUP BY SubLedgers.SubHead
    `);

  const balanceMap = {};
  for (const row of balanceResult.recordset) {
    // mirrors VB: varamount = Credit1; if Debit1 exists, varamount = Debit1 - Credit1
    const credit1 = row.Credit1 || 0;
    const debit1 = row.Debit1 || 0;
    balanceMap[row.SubHead] = debit1 > 0 ? debit1 - credit1 : credit1;
  }

  // 3. Merge — mirrors VB's dgvHeads columns: Head, Credit(=balance paid),
  //    Debit(=amount owed from config), Balance Head-Wise(=same balance)
  return heads.map((h) => {
    const balance = Number(balanceMap[h.Head]) || 0;

    return {
      Head: h.Head,
      Debit: Number(h.Debit) || 0,
      Credit: balance,
      BalanceHeadWise: balance,
      Concession: 0,
    };
  });
};

const getCurrentMasterSession = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1 CurrentSession 
      FROM MasterSession 
      ORDER BY Session DESC
    `);
    return result.recordset[0]?.CurrentSession || "";
  } catch (err) {
    console.warn("Error fetching MasterSession:", err.message);
    return "";
  }
};

module.exports = {
  getStudentById,
  getLedger,
  getFeeHeads,
  saveFeeEntry,
  calcReceiptNo,
  genTransactionId,
  getSchemes,
  getCategories,
  getModesOfAdmission,
  updateStudentAdmissionMeta,
  getFeeStructureWithBalances,
  getCurrentSemester,
  getCurrentMasterSession,
};