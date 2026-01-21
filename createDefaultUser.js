const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../db/database');

async function createDefaultUser() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return;
    }

    // Create default MCD Officer user
    const password = 'admin123'; // Default password
    const passwordHash = await bcrypt.hash(password, 10);

    const officer = await User.create({
      username: 'admin',
      email: 'admin@mcd.com',
      password_hash: passwordHash,
      full_name: 'MCD Officer',
      role: 'officer',
      phone: null,
      status: 'active'
    });

    console.log('✅ Default MCD Officer user created successfully!');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: officer (Full access to zones and violations)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating default user:', error);
    process.exit(1);
  }
}

createDefaultUser();

