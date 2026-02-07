const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

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

async function inspectTable() {
  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query('DESCRIBE users;');
    
    // Write to a file
    const outputPath = path.join(__dirname, 'db_user_columns.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`✅ Saved user schema to ${outputPath}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

inspectTable();
