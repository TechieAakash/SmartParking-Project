const { sequelize } = require('../src/config/database');

async function updateSchema() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Add price column
    try {
      await queryInterface.addColumn('passes', 'price', {
        type: 'DECIMAL(10, 2)',
        allowNull: false,
        defaultValue: 0.00
      });
      console.log('Added price column to passes table');
    } catch (e) {
      console.log('price column might already exist:', e.message);
    }

    // Add qr_code column
    try {
      await queryInterface.addColumn('passes', 'qr_code', {
        type: 'VARCHAR(255)',
        allowNull: true
      });
      console.log('Added qr_code column to passes table');
    } catch (e) {
      console.log('qr_code column might already exist:', e.message);
    }

    console.log('Schema update completed');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    await sequelize.close();
  }
}

updateSchema();
