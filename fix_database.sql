-- Force fix for foreign key constraint issue
-- This will drop and recreate the problematic tables

USE smartparking;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the passes table if it exists
DROP TABLE IF EXISTS passes;

-- Drop any tables that might reference users incorrectly
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS wallet_transactions;

-- Drop and recreate users table with correct structure
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'officer', 'viewer', 'user', 'driver') DEFAULT 'viewer',
    phone VARCHAR(20),
    otp_code VARCHAR(10),
    otp_expiry DATETIME,
    refresh_token VARCHAR(512),
    mcd_govt_id VARCHAR(50),
    officer_badge_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    profile_photo VARCHAR(255),
    registration_ip VARCHAR(45),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recreate vehicles table
CREATE TABLE vehicles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type ENUM('car', 'bike', 'ev', 'truck', 'bus') DEFAULT 'car',
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recreate wallets table
CREATE TABLE wallets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recreate wallet_transactions table
CREATE TABLE wallet_transactions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    wallet_id INT UNSIGNED NOT NULL,
    transaction_type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Recreate bookings table
CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    zone_id INT UNSIGNED NOT NULL,
    vehicle_id INT UNSIGNED,
    booking_start DATETIME NOT NULL,
    booking_end DATETIME NOT NULL,
    total_amount DECIMAL(10, 2),
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    status ENUM('active', 'completed', 'cancelled', 'expired') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- Recreate passes table
CREATE TABLE passes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    plan_id INT UNSIGNED,
    vehicle_id INT UNSIGNED,
    pass_type ENUM('monthly', 'yearly') NOT NULL,
    zone_id INT UNSIGNED,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@smartparking.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'MCD Administrator', 'admin'),
('officer1', 'officer1@mcd.gov.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'Rajesh Kumar', 'officer'),
('viewer1', 'viewer@gmail.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'General Visitor', 'viewer');

SELECT 'Database tables fixed successfully!' as Status;
