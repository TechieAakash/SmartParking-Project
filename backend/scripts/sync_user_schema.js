const { Sequelize } = require('sequelize');

// User provided connection string
const databaseUrl = 'mysql://root:QknKljREygofzvfcmmEZCfeUcPUgJMiC@mainline.proxy.rlwy.net:56393/railway';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: console.log,
  dialectOptions: {
    connectTimeout: 60000,
    ssl: { require: false, rejectUnauthorized: false }
  }
});

async function updateSchema() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Update ROLE enum to support 'user' and 'driver'
    console.log('🔄 Updating ROLE enum...');
    try {
      await sequelize.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'officer', 'viewer', 'user', 'driver') 
        NOT NULL DEFAULT 'viewer';
      `);
      console.log('✅ Role enum updated.');
    } catch (e) { console.error('⚠️ Role update error (might already be set):', e.message); }

    // 2. Add missing columns
    const columns = [
      { name: 'officer_badge_id', type: 'VARCHAR(50) NULL UNIQUE' },
      { name: 'department', type: 'VARCHAR(100) NULL' },
      { name: 'is_verified', type: 'BOOLEAN DEFAULT false' },
      { name: 'verified_at', type: 'DATETIME NULL' },
      { name: 'profile_photo', type: 'VARCHAR(255) NULL' },
      { name: 'registration_ip', type: 'VARCHAR(45) NULL' }
    ];

    for (const col of columns) {
      console.log(`➕ Adding column: ${col.name}...`);
      try {
        await sequelize.query(`
          ALTER TABLE users
          ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✅ ${col.name} added.`);
      } catch (err) {
        if (err.message.includes('Duplicate column')) {
          console.log(`⚠️ ${col.name} already exists.`);
        } else {
          console.error(`❌ Failed to add ${col.name}:`, err.message);
        }
      }
    }

    console.log('🎉 Schema synchronization complete!');

  } catch (err) {
    console.error('❌ Fatal Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

updateSchema();
