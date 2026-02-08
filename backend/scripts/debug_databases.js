const { Sequelize } = require('sequelize');

// Connection to the server root (no DB specified initially if possible, or default to railway)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Connection to the server root (no DB specified initially if possible, or default to railway)
const databaseUrl = process.env.MYSQL_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 60000, 
    ssl: { require: false, rejectUnauthorized: false }
  }
});

async function listDatabases() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Railway DB.');
    
    // Show current database
    const [curr] = await sequelize.query('SELECT DATABASE() as db');
    console.log('📍 Current Database:', curr[0].db);

    // List all databases
    const [dbs] = await sequelize.query('SHOW DATABASES');
    console.log('📚 Available Databases:');
    dbs.forEach(db => console.log(` - ${db.Database}`));

    // Inspect 'users' table in 'railway' (already done)
    // Inspect 'users' table in 'smartparking' if it exists
    const smartParkingExists = dbs.find(d => d.Database === 'smartparking');
    if (smartParkingExists) {
      console.log('\n🔍 Check smartparking.users columns:');
      const [cols] = await sequelize.query('DESCRIBE smartparking.users');
      cols.forEach(c => console.log(`   - ${c.Field}`));
    } else {
        console.log('\n❌ database smartparking does NOT exist.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

listDatabases();
