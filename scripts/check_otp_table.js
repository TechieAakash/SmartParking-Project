const { sequelize } = require('../backend/src/config/database');

async function checkTable() {
  try {
    const [results] = await sequelize.query('DESCRIBE otp_codes');
    console.log('--- Detailed Columns in otp_codes ---');
    results.forEach(r => {
      console.log(`Column: ${r.Field} | Null: ${r.Null} | Default: ${r.Default} | Extra: ${r.Extra}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error describing table:', err.message);
    process.exit(1);
  }
}

checkTable();
