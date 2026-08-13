const fs = require('fs');
const { getPool } = require('./config/db');

async function testSessionQuery() {
  try {
    const pool = await getPool();
    let q1Res, q2Res, q3Res, error1, error2, error3;

    try {
      const res = await pool.request().query("SELECT Session FROM MasterSession ORDER BY CurrentSession DESC");
      q1Res = res.recordset.map(r => r.Session);
    } catch (e) {
      error1 = e.message;
    }

    try {
      const res = await pool.request().query("SELECT Session FROM MasterSession");
      q2Res = res.recordset.map(r => r.Session);
    } catch (e) {
      error2 = e.message;
    }

    try {
      const res = await pool.request().query("SELECT TOP 5 * FROM MasterSession");
      q3Res = res.recordset;
    } catch (e) {
      error3 = e.message;
    }

    const output = {
      q1_with_order: q1Res,
      error1,
      q2_simple: q2Res,
      error2,
      q3_sample_rows: q3Res,
      error3
    };

    fs.writeFileSync('./scratch_session_debug.json', JSON.stringify(output, null, 2));
    console.log("SUCCESSFULLY LOGGED SESSION DEBUG INFO");
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('./scratch_session_debug.json', JSON.stringify({ fatal: err.message }, null, 2));
    process.exit(1);
  }
}

testSessionQuery();
