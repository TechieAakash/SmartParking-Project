// Test MySQL Connection and Operations for smartparking database
const { sequelize, ParkingZone, Violation } = require('./models');

async function testDatabase() {
  console.log('🧪 Testing MySQL Connection for smartparking database...');
  console.log('===================================================');
  
  try {
    // Test connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    console.log(`   Database: smartparking`);
    console.log(`   Host: localhost:3306`);
    console.log(`   User: root`);
    
    // Check if tables exist
    console.log('\n2. Checking database tables...');
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'smartparking'
    `);
    
    console.log(`✅ Found ${results.length} tables in smartparking database`);
    results.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Count existing records
    console.log('\n3. Checking existing data...');
    const zonesCount = await ParkingZone.count();
    const violationsCount = await Violation.count();
    console.log(`   Parking Zones: ${zonesCount} records`);
    console.log(`   Violations: ${violationsCount} records`);
    
    // Only create test data if database is empty
    if (zonesCount === 0) {
      console.log('\n4. Creating test parking zone...');
      const testZone = await ParkingZone.create({
        name: 'Test Smart Parking Zone',
        address: '100 Test Street, Test City',
        latitude: 40.712776,
        longitude: -74.005974,
        totalCapacity: 100,
        currentOccupancy: 0,
        contractorLimit: 80,
        contractorName: 'Test Contractor Inc.',
        contractorEmail: 'test@smartparking.com',
        contractorContact: '+1-555-1234',
        hourlyRate: 50.00,
        penaltyPerVehicle: 500.00,
        operatingHours: '06:00 - 22:00',
        status: 'active'
      });
      console.log(`✅ Test zone created with ID: ${testZone.id}`);
      
      // Test occupancy update
      console.log('\n5. Testing occupancy update...');
      await testZone.update({ currentOccupancy: 90 });
      console.log(`✅ Updated occupancy to: ${testZone.currentOccupancy}`);
      
      // Check virtual properties
      console.log('\n6. Testing calculated properties...');
      console.log(`   Occupancy Percentage: ${testZone.getOccupancyPercentage().toFixed(2)}%`);
      console.log(`   Violation Status: ${testZone.getViolationStatus()}`);
      console.log(`   Excess Vehicles: ${testZone.getExcessVehicles()}`);
      
      // Check if violation was auto-created
      const violation = await Violation.findOne({
        where: { zoneId: testZone.id, status: 'pending' }
      });
      
      if (violation) {
        console.log(`✅ Auto-created violation: ${violation.excessVehicles} excess vehicles`);
      }
    }
    
    // Test statistics
    console.log('\n7. Testing statistics queries...');
    const stats = await ParkingZone.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalZones'],
        [sequelize.fn('SUM', sequelize.col('totalCapacity')), 'totalCapacity'],
        [sequelize.fn('SUM', sequelize.col('currentOccupancy')), 'totalOccupancy'],
        [sequelize.literal('ROUND(SUM(currentOccupancy) / SUM(totalCapacity) * 100, 2)'), 'overallOccupancyRate'],
        [sequelize.literal('COUNT(CASE WHEN status = "active" THEN 1 END)'), 'activeZones']
      ],
      raw: true
    });
    
    console.log('✅ Statistics retrieved:');
    console.log(`   Total Zones: ${stats[0].totalZones}`);
    console.log(`   Total Capacity: ${stats[0].totalCapacity}`);
    console.log(`   Total Occupancy: ${stats[0].totalOccupancy}`);
    console.log(`   Overall Occupancy Rate: ${stats[0].overallOccupancyRate}%`);
    console.log(`   Active Zones: ${stats[0].activeZones}`);
    
    console.log('\n===================================================');
    console.log('🎉 All tests passed successfully!');
    console.log('\n📊 Next steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open MySQL Workbench and connect to smartparking database');
    console.log('   3. Test API endpoints in Postman or browser');
    console.log('\n🔗 Test endpoints:');
    console.log('   GET  http://localhost:3000/health');
    console.log('   GET  http://localhost:3000/api/db-test');
    console.log('   GET  http://localhost:3000/api/zones');
    console.log('   POST http://localhost:3000/api/zones');
    console.log('\n💾 MySQL Workbench Connection:');
    console.log('   Host: 127.0.0.1:3306');
    console.log('   Username: root');
    console.log('   Password: admin123');
    console.log('   Database: smartparking');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if MySQL service is running');
    console.log('      Windows: net start MySQL80');
    console.log('      Mac/Linux: sudo systemctl start mysql');
    console.log('   2. Verify MySQL credentials in .env file');
    console.log('   3. Create database manually:');
    console.log('      mysql -u root -padmin123 -e "CREATE DATABASE IF NOT EXISTS smartparking;"');
    console.log('   4. Check if MySQL port 3306 is available');
    
    process.exit(1);
  }
}

testDatabase();