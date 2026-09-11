const { sql, getPool } = require("../config/db");

// Mirrors DisplayData(): calls DayBookAllSubLedgers with a date range.
async function getDayBookAllSubLedgers({ collegeName, dateFrom, dateTo }) {
  const pool = await getPool();
  const request = pool.request();

  request.input("CollegeName", sql.VarChar, collegeName || null);
  // VB formats as "MM/dd/yyyy 00:01:01" / "MM/dd/yyyy 23:59:59" — passed as
  // datetime here instead, letting the driver handle the conversion; the
  // effective range (start-of-day to end-of-day) is the same.
  request.input("Date", sql.DateTime, new Date(`${dateFrom}T00:01:01`));
  request.input("Date1", sql.DateTime, new Date(`${dateTo}T23:59:59`));
  request.timeout = 120000;

  const result = await request.execute("DayBookAllSubLedgers");
  return result.recordset;
}

// Mirrors the cash/other/total lookup inside BtnPrint_Click.
async function getCashAndOtherTotals({ collegeName, dateFrom, dateTo }) {
  const pool = await getPool();
  const request = pool.request();

  request.input("CollegeName", sql.VarChar, collegeName || null);
  request.input("Date", sql.DateTime, new Date(`${dateFrom}T00:01:01`));
  request.input("Date1", sql.DateTime, new Date(`${dateTo}T23:59:59`));
  request.timeout = 120000;

  const result = await request.execute("DayBookAllSubLedgersCashAndOther");
  const row = result.recordset[0] || {};
  const cash = row.Cash != null ? Number(row.Cash) : 0;
  const other = row.Other != null ? Number(row.Other) : 0;
  return { cash, other, total: cash + other };
}

module.exports = { getDayBookAllSubLedgers, getCashAndOtherTotals };