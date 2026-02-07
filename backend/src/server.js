/**
 * Server Initialization
 * Starts the Express server and connects to database
 * Updated: Fixed ValidOfficerBadge schema
 */

const app = require('./app');
const config = require('./config/env');
const { testConnection, sequelize } = require('./config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error.name, error.message);
  process.exit(1);
});

let server;

const startServer = async () => {
  try {
    // DISABLED: Database recreation was wiping all users on every restart!
    // To manually reset the database, run: node scripts/recreate-db.js
    // The code below was causing "Account no longer exists" errors
    // because it deleted all users from the database on every server start.
    /*
    if (config.nodeEnv === 'development') {
      console.log('🔄 Recreating database with correct schema...');
      
      const fs = require('fs');
      const path = require('path');
      const mysql = require('mysql2/promise');
      const sqlPath = path.join(__dirname, '..', 'recreate_database.sql');
      
      if (fs.existsSync(sqlPath)) {
        const tempConnection = await mysql.createConnection({
          host: config.database.host,
          port: config.database.port,
          user: config.database.user,
          password: config.database.password,
          multipleStatements: true
        });
        
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        try {
          await tempConnection.query(sql);
          console.log('✅ Database recreated successfully');
        } catch (err) {
          console.error('Error executing SQL:', err.message);
        } finally {
          await tempConnection.end();
        }
      } else {
        console.log('⚠️ recreate_database.sql not found');
      }
    }
    */
    console.log('📊 Connecting to existing database (recreation disabled)...');
    
    // NOW test database connection (after database is created)
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }
    
    // Seed Data in Background (So server starts immediately)
    // Seed Data in Background moved to app.listen callback
    // seedDatabase().catch(err => console.error('❌ Seeding failed:', err));

    // Start server with Railway PORT support
    const PORT = process.env.PORT || config.port || 3000;
    
    console.log(`⏳ Attempting to bind to PORT: ${PORT}`);
    
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server bound successfully!');
      
      // Seed Data in Background AFTER server is listening
      // This prevents 'require' blocking or DB slow-down from killing deployment
      seedDatabase().catch(err => console.error('❌ Seeding failed:', err));
      
      console.log('');
      console.log('🚀 ============================================');
      console.log('   Smart Parking Management System');
      console.log('============================================ 🚀');
      console.log('');
      console.log(`📡 Server running in ${config.nodeEnv} mode`);
      console.log(`🌐 PORT: ${PORT}`);
      console.log(`📊 API: /api`);
      console.log(`💚 Health: /api/health`);
      
      // Show public URL if on Railway
      if (process.env.RAILWAY_ENVIRONMENT) {
        console.log(`🚂 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
        if (process.env.RAILWAY_STATIC_URL) {
          console.log(`🌍 Public URL: ${process.env.RAILWAY_STATIC_URL}`);
        }
      }
      
      console.log('');
      console.log('Press CTRL+C to stop');
      console.log('');
    });
    
    // Prevent 502 Bad Gateway errors on Render/Load Balancers
    server.keepAliveTimeout = 120 * 1000;
    server.headersTimeout = 120 * 1000;

    server.on('error', (error) => {
      console.error('❌ FATAL SERVER ERROR:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(error);
  
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  
  if (server) {
    server.close(async () => {
      console.log('💤 Server closed');
      
      try {
        await sequelize.close();
        console.log('💤 Database connection closed');
      } catch (error) {
        console.error('❌ Error closing database:', error.message);
      }
      
      process.exit(0);
    });
  }
});

// Async Database Seeding
const seedDatabase = async () => {
    try {
        const models = require('./models');
        const { User, ParkingZone, Setting, Violation, ValidOfficerBadge, sequelize } = models;
        
        console.log('🔄 Checking/Creating database tables...');
        // Sync all models (creates tables if they don't exist and updates columns)
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables ready');
        
        // 1. Users Check
        const userCount = await User.count();
        if (userCount === 0) {
            console.log('🌱 Seeding initial data (Background Process)...');
            const bcrypt = require('bcryptjs');
            const hashedPass = await bcrypt.hash('admin123', 10);
            
            await User.bulkCreate([
                { username: 'admin', email: 'admin@smartparking.com', passwordHash: hashedPass, fullName: 'MCD Administrator', role: 'admin' },
                { username: 'officer1', email: 'officer1@mcd.gov.in', passwordHash: hashedPass, fullName: 'Rajesh Kumar', role: 'officer' },
                { username: 'viewer1', email: 'viewer@gmail.com', passwordHash: hashedPass, fullName: 'General Visitor', role: 'viewer' }
            ]);
            console.log('✅ Standard accounts created');

            // 2. Zones
            const zones = await ParkingZone.bulkCreate([
              { name: 'Downtown Central Parking', address: 'Connaught Place, Delhi', latitude: 28.6328, longitude: 77.2197, totalCapacity: 200, currentOccupancy: 185, contractorLimit: 180, contractorName: 'City Contractors Inc.', contractorContact: '+1-555-0101', hourlyRate: 60.00, penaltyPerVehicle: 750.00 },
              { name: 'Mall Plaza Parking', address: 'Select Citywalk, Saket, Delhi', latitude: 28.5283, longitude: 77.2185, totalCapacity: 500, currentOccupancy: 475, contractorLimit: 450, contractorName: 'Mall Management Group', contractorContact: '+1-555-0102', hourlyRate: 70.00, penaltyPerVehicle: 850.00 },
              { name: 'Tech Park Zone A', address: 'Okhla Industrial Estate, Delhi', latitude: 28.5358, longitude: 77.2732, totalCapacity: 300, currentOccupancy: 275, contractorLimit: 250, contractorName: 'Tech Park Authority', contractorContact: '+1-555-0103', hourlyRate: 80.00, penaltyPerVehicle: 1000.00 },
              { name: 'University North Campus', address: 'North Campus, DU, Delhi', latitude: 28.6892, longitude: 77.2106, totalCapacity: 400, currentOccupancy: 320, contractorLimit: 350, contractorName: 'University Services', contractorContact: '+1-555-0104', hourlyRate: 40.00, penaltyPerVehicle: 500.00 },
              { name: 'Hospital Emergency Parking', address: 'AIIMS, Ansari Nagar, Delhi', latitude: 28.5672, longitude: 77.2100, totalCapacity: 150, currentOccupancy: 140, contractorLimit: 120, contractorName: 'Hospital Admin', contractorContact: '+1-555-0105', hourlyRate: 30.00, penaltyPerVehicle: 1000.00 },
              { name: 'Airport Terminal A', address: 'IGI Airport, Terminal 3, Delhi', latitude: 28.5562, longitude: 77.1000, totalCapacity: 800, currentOccupancy: 650, contractorLimit: 700, contractorName: 'Airport Authority', contractorContact: '+1-555-0106', hourlyRate: 100.00, penaltyPerVehicle: 1500.00 },
              { name: 'Stadium West Parking', address: 'Jawaharlal Nehru Stadium, Delhi', latitude: 28.5828, longitude: 77.2344, totalCapacity: 1000, currentOccupancy: 450, contractorLimit: 800, contractorName: 'Stadium Management', contractorContact: '+1-555-0107', hourlyRate: 90.00, penaltyPerVehicle: 1200.00 },
              { name: 'Business District Parking', address: 'Nehru Place, Delhi', latitude: 28.5494, longitude: 77.2515, totalCapacity: 350, currentOccupancy: 300, contractorLimit: 300, contractorName: 'Business District Corp', contractorContact: '+1-555-0108', hourlyRate: 75.00, penaltyPerVehicle: 900.00 },
              { name: 'Shopping Center Parking', address: 'Karol Bagh, Delhi', latitude: 28.6441, longitude: 77.1882, totalCapacity: 600, currentOccupancy: 520, contractorLimit: 500, contractorName: 'Retail Management', contractorContact: '+1-555-0109', hourlyRate: 65.00, penaltyPerVehicle: 800.00 },
              { name: 'Residential Complex Parking', address: 'Rohini Sector 15, Delhi', latitude: 28.7299, longitude: 77.1215, totalCapacity: 250, currentOccupancy: 180, contractorLimit: 200, contractorName: 'Residential Association', contractorContact: '+1-555-0110', hourlyRate: 45.00, penaltyPerVehicle: 600.00 }
            ]);
            console.log('🅿️ Zones seeded');

            // 3. Violations
            const zoneIds = zones.reduce((acc, z) => ({ ...acc, [z.name]: z.id }), {});
            await Violation.bulkCreate([
              { zoneId: zoneIds['Downtown Central Parking'], severity: 'critical', excessVehicles: 15, penaltyAmount: 11250.00, resolved: false, autoGenerated: true },
              { zoneId: zoneIds['Mall Plaza Parking'], severity: 'critical', excessVehicles: 25, penaltyAmount: 21250.00, resolved: false, autoGenerated: true },
              { zoneId: zoneIds['Tech Park Zone A'], severity: 'critical', excessVehicles: 25, penaltyAmount: 25000.00, resolved: false, autoGenerated: true },
              { zoneId: zoneIds['Hospital Emergency Parking'], severity: 'critical', excessVehicles: 20, penaltyAmount: 20000.00, resolved: true, resolvedAt: new Date(), autoGenerated: true },
              { zoneId: zoneIds['Airport Terminal A'], severity: 'warning', excessVehicles: 10, penaltyAmount: 15000.00, resolved: true, resolvedAt: new Date(), autoGenerated: true },
              { zoneId: zoneIds['Downtown Central Parking'], severity: 'warning', excessVehicles: 5, penaltyAmount: 3750.00, resolved: false, autoGenerated: true }
            ]);
            
            await Setting.create({ 
               settingKey: 'system_name', settingValue: 'MCD Smart Parking', settingType: 'string', category: 'general' 
            });
            console.log('✨ Initial Data Seeding Complete');
        }

        // 4. Badges
        const badgeCount = await ValidOfficerBadge.count();
        if (badgeCount === 0) {
            console.log('🌱 Seeding Badges (Background)...');
            const badges = [];
            for (let i = 1001; i <= 1050; i++) {
                badges.push({ badgeId: `MCD-OFF-${i}` });
            }
            await ValidOfficerBadge.bulkCreate(badges);
            console.log('✅ Badges seeded');
        }

    } catch (error) {
        console.error('❌ Background Seeding Error:', error);
    }
};

// Start the server
startServer();
