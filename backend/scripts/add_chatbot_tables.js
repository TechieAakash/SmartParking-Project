/**
 * Add Chatbot Tables to Railway MySQL
 * Creates chat_sessions and chat_messages tables for Kuro AI
 */

const mysql = require('mysql2/promise');

async function addChatbotTables() {
  const connectionString = process.env.MYSQL_URL;
  
  if (!connectionString) {
    console.error('❌ MYSQL_URL not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to Railway MySQL...');
  
  const connection = await mysql.createConnection({
    uri: connectionString,
    connectTimeout: 30000,
    waitForConnections: true
  });

  try {
    console.log('✅ Connected!');
    
    // Create chat_sessions table
    console.log('📋 Creating chat_sessions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NULL,
        title VARCHAR(255) NULL,
        status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ chat_sessions table created');

    // Create chat_messages table
    console.log('📋 Creating chat_messages table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_id (session_id),
        INDEX idx_role (role),
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ chat_messages table created');

    // Verify tables exist
    const [tables] = await connection.execute("SHOW TABLES LIKE 'chat%'");
    console.log('\n📊 Chat tables created:');
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

    console.log('\n🎉 Kuro AI chatbot tables ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
    process.exit(0);
  }
}

addChatbotTables().catch(err => {
  console.error(err);
  process.exit(1);
});
