const { sequelize } = require('../backend/src/config/database');

async function checkUserTable() {
  try {
    const [results] = await sequelize.query('DESCRIBE users');
    console.log('--- Columns in users ---');
    results.forEach(r => console.log(`- ${r.Field}`));
    process.exit(0);
  } catch (err) {
    console.error('Error describing table:', err.message);
    process.exit(1);
  }
}

checkUserTable();
