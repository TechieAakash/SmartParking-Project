const mysql = require('mysql2/promise');

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: 'mainline.proxy.rlwy.net',
    user: 'root',
    password: 'QknKljREygofzvfcmmEZCfeUcPUgJMiC',
    port: 56393,
    database: 'railway', // Using 'railway' as per connection string
    ssl: { rejectUnauthorized: false } // Required for Railway usually
  });

  console.log('Connected to Railway database!');

  try {
    // 1. Add zone_id, entry_time, total_price to bookings table
    console.log('Checking bookings table...');
    const [bookingCols] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'zone_id'");
    if (bookingCols.length === 0) {
      console.log('Adding zone_id to bookings...');
      await connection.query("ALTER TABLE bookings ADD COLUMN zone_id INT UNSIGNED NOT NULL AFTER user_id");
      await connection.query("ALTER TABLE bookings ADD CONSTRAINT fk_bookings_zone FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE");
    } else {
        console.log('bookings.zone_id already exists.');
    }

    const [entryTimeCols] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'entry_time'");
    if (entryTimeCols.length === 0) {
         console.log('Adding entry_time to bookings...');
         await connection.query("ALTER TABLE bookings ADD COLUMN entry_time DATETIME AFTER booking_end");
    }

    const [totalPriceCols] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'total_price'");
    if (totalPriceCols.length === 0) {
         console.log('Adding total_price to bookings...');
         await connection.query("ALTER TABLE bookings ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0.00 AFTER status");
    }


    // 2. Update passes table pass_type ENUM
    console.log('Checking passes table...');
    // We can't easily check ENUM values via query, but alter is idempotent-ish if it's the same
    console.log('Updating pass_type ENUM to include weekly...');
    await connection.query("ALTER TABLE passes MODIFY COLUMN pass_type ENUM('weekly', 'monthly', 'yearly') NOT NULL");

    // Add price, qr_code to passes
    const [priceCols] = await connection.query("SHOW COLUMNS FROM passes LIKE 'price'");
    if (priceCols.length === 0) {
        console.log('Adding price to passes...');
        await connection.query("ALTER TABLE passes ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER status");
    }
    
    const [qrCols] = await connection.query("SHOW COLUMNS FROM passes LIKE 'qr_code'");
    if (qrCols.length === 0) {
        console.log('Adding qr_code to passes...');
        await connection.query("ALTER TABLE passes ADD COLUMN qr_code VARCHAR(100) AFTER price");
    }


    // 3. Create formatted tables if missing
    console.log('Checking missing tables...');

    // Wallets
    await connection.query(`
        CREATE TABLE IF NOT EXISTS wallets (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL UNIQUE,
            balance DECIMAL(10, 2) DEFAULT 0.00,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('Checked wallets table.');

    // Wallet Transactions
    await connection.query(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL,
            wallet_id INT UNSIGNED NOT NULL,
            transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            balance_after DECIMAL(10, 2) NOT NULL,
            description VARCHAR(255),
            reference_id VARCHAR(100),
            status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
        )
    `);
    console.log('Checked wallet_transactions table.');

    // Valid Officer Badges
    await connection.query(`
        CREATE TABLE IF NOT EXISTS valid_officer_badges (
            badge_id VARCHAR(50) PRIMARY KEY,
            is_claimed BOOLEAN DEFAULT FALSE,
            claimed_by INT UNSIGNED,
            FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    console.log('Checked valid_officer_badges table.');

    // OTP Codes
    await connection.query(`
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contact VARCHAR(100) NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_contact (contact)
        )
    `);
    console.log('Checked otp_codes table.');
    
    // 4. Update Users table for new columns
    // refresh_token, officer_badge_id, department, is_verified, verified_at, profile_photo, registration_ip, google_id
    console.log('Checking users table columns...');
    
    const [refreshCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'refresh_token'");
    if (refreshCols.length === 0) await connection.query("ALTER TABLE users ADD COLUMN refresh_token VARCHAR(512) AFTER phone");

    const [badgeCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'officer_badge_id'");
    if (badgeCols.length === 0) await connection.query("ALTER TABLE users ADD COLUMN officer_badge_id VARCHAR(50) UNIQUE AFTER mcd_govt_id");
    
    const [deptCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'department'");
    if (deptCols.length === 0) await connection.query("ALTER TABLE users ADD COLUMN department VARCHAR(100) AFTER officer_badge_id");

    const [verifiedCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'is_verified'");
    if (verifiedCols.length === 0) {
        await connection.query("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER department");
        await connection.query("ALTER TABLE users ADD COLUMN verified_at DATETIME AFTER is_verified");
    }

    const [photoCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'profile_photo'");
    if (photoCols.length === 0) await connection.query("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) AFTER verified_at");

    const [ipCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'registration_ip'");
    if (ipCols.length === 0) await connection.query("ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45) AFTER profile_photo");

    const [googleCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'google_id'");
    if (googleCols.length === 0) await connection.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(100) UNIQUE AFTER registration_ip");

    // Update role ENUM
    // Note: modifying ENUM can be tricky if data exists that doesn't match, but valid additions are usually fine.
    console.log('Updating user role ENUM...');
    await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'officer', 'viewer', 'user', 'driver') DEFAULT 'viewer'");

    console.log('✅ Database schema verified and updated successfully!');

  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
  } finally {
    await connection.end();
  }
}

fixDatabase();
