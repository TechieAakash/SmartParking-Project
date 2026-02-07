const { Sequelize } = require('sequelize');

// User provided connection string
const databaseUrl = 'mysql://root:QknKljREygofzvfcmmEZCfeUcPUgJMiC@mainline.proxy.rlwy.net:56393/railway';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 60000, 
    ssl: { require: false, rejectUnauthorized: false }
  }
});

async function listTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected.');
    
    const [results] = await sequelize.query('SHOW TABLES;');
    console.log('📋 Tables in `railway` database:');
    results.forEach(row => {
      console.log(`- ${Object.values(row)[0]}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

listTables();
