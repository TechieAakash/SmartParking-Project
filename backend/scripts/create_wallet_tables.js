const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function createTables() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_NAME || 'smartpark',
      multipleStatements: true
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('Connected.');

    // Drop first to ensure clean state
    await connection.query('DROP TABLE IF EXISTS wallet_transactions');
    await connection.query('DROP TABLE IF EXISTS wallets');
    console.log('Dropped existing wallet tables.');

    // Create tables with standard INT (Signed) to be safe with unknown users schema
    // If users.id is unsigned, we might need to change user_id to UNSIGNED
    // But standard SQL dump shows INT.

    const sql = `
      CREATE TABLE wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wallet_id INT NOT NULL,
        user_id INT NOT NULL,
        transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        balance_after DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255),
        reference_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(sql);
    console.log('Wallet tables created successfully (Signed INTs).');

  } catch (error) {
    console.error('Error with Signed INTs:', error.message);
    
    // Fallback: Try Unsigned if the above failed due to FK incompatibility
    if (error.message.includes('incompatible') || error.message.includes('Foreign key')) {
        console.log('Retrying with UNSIGNED INTs...');
        try {
            await connection.query('DROP TABLE IF EXISTS wallet_transactions');
            await connection.query('DROP TABLE IF EXISTS wallets');
            
            const sqlUnsigned = `
              CREATE TABLE wallets (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL, -- Keep signed for user? No, if signed failed, try unsigned there too?
                -- Actually let's try mixing: Wallets keys Unsigned, User key Signed/Unsigned?
                -- Safest: match references.
                -- Let's assume users.id IS INT (Signed).
                -- So user_id must be INT.
                -- But maybe wallets.id needs to be INT? (we did that).
                
                -- What if users.id IS UNSIGNED?
                -- Let's try ALL UNSIGNED.
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL UNIQUE, 
                balance DECIMAL(10, 2) DEFAULT 0.00,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

              CREATE TABLE wallet_transactions (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                wallet_id INT UNSIGNED NOT NULL,
                user_id INT UNSIGNED NOT NULL,
                transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                balance_after DECIMAL(10, 2) NOT NULL,
                description VARCHAR(255),
                reference_id VARCHAR(100),
                status VARCHAR(20) DEFAULT 'completed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;
            // Note: The SQL string above has duplicate keys in wallets definition (id). 
            // Correcting the string logic below strictly.
            
            const validSqlUnsigned = `
              CREATE TABLE wallets (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL UNIQUE, 
                balance DECIMAL(10, 2) DEFAULT 0.00,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

              CREATE TABLE wallet_transactions (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                wallet_id INT UNSIGNED NOT NULL,
                user_id INT UNSIGNED NOT NULL,
                transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                balance_after DECIMAL(10, 2) NOT NULL,
                description VARCHAR(255),
                reference_id VARCHAR(100),
                status VARCHAR(20) DEFAULT 'completed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;
            
            await connection.query(validSqlUnsigned);
            console.log('Wallet tables created successfully (Unsigned INTs).');
        } catch (err2) {
             console.error('Fatal error with Unsigned too:', err2.message);
        }
    }
  } finally {
    if (connection) await connection.end();
  }
}

createTables();
