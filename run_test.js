const fs = require('fs');
const { getPool } = require('./config/db');

async function main() {
  const p = await getPool();
  
  const s = await p.request().query('SELECT Session FROM MasterSession ORDER BY CurrentSession DESC');
  fs.writeFileSync('out_sessions.json', JSON.stringify(s.recordset, null, 2));

  let semRes = [];
  try {
    const sem = await p.request().query("SELECT DISTINCT Semester FROM MasterAnnualFee WHERE Semester IS NOT NULL AND Semester <> ''");
    semRes = sem.recordset;
  } catch (e) {}

  let semRes2 = [];
  try {
    const sem2 = await p.request().query("SELECT DISTINCT Semester FROM MasterSemester WHERE Semester IS NOT NULL AND Semester <> ''");
    semRes2 = sem2.recordset;
  } catch (e) {}

  let semRes3 = [];
  try {
    const sem3 = await p.request().query("SELECT DISTINCT Semester FROM Ledger WHERE Semester IS NOT NULL AND Semester <> ''");
    semRes3 = sem3.recordset;
  } catch (e) {}

  let semRes4 = [];
  try {
    const sem4 = await p.request().query("SELECT DISTINCT Semester FROM Admissions WHERE Semester IS NOT NULL AND Semester <> ''");
    semRes4 = sem4.recordset;
  } catch (e) {}

  fs.writeFileSync('out_semesters.json', JSON.stringify({ MasterAnnualFee: semRes, MasterSemester: semRes2, Ledger: semRes3, Admissions: semRes4 }, null, 2));
  console.log("DONE WRITING FILES!");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
