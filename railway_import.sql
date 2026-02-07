-- Railway MySQL Import Script
-- Copy and paste this into Railway's Query console

USE railway;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS chatbot_logs;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS passes;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS parking_slots;
DROP TABLE IF EXISTS violations;
DROP TABLE IF EXISTS parking_zones;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users table
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'officer', 'viewer') DEFAULT 'viewer',
    phone VARCHAR(20),
    mcd_govt_id VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 1.1 Vehicles table
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

-- 2. Parking Zones table
CREATE TABLE parking_zones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    total_capacity INT NOT NULL,
    current_occupancy INT NOT NULL DEFAULT 0,
    contractor_limit INT NOT NULL,
    contractor_name VARCHAR(100) NOT NULL,
    contractor_contact VARCHAR(20),
    contractor_email VARCHAR(100),
    hourly_rate DECIMAL(10, 2) DEFAULT 50.00,
    penalty_per_vehicle DECIMAL(10, 2) DEFAULT 500.00,
    operating_hours VARCHAR(50) DEFAULT '06:00 - 22:00',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Parking Slots
CREATE TABLE parking_slots (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_id INT UNSIGNED NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    slot_type ENUM('car', 'bike', 'ev', 'disabled') DEFAULT 'car',
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE
);

-- 4. Violations table
CREATE TABLE violations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_id INT UNSIGNED NOT NULL,
    severity ENUM('warning', 'critical') NOT NULL,
    excess_vehicles INT NOT NULL,
    penalty_amount DECIMAL(10, 2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    notes TEXT,
    auto_generated BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE
);

-- 5. Bookings
CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    slot_id INT UNSIGNED NOT NULL,
    vehicle_id INT UNSIGNED,
    booking_start DATETIME NOT NULL,
    booking_end DATETIME NOT NULL,
    booking_type ENUM('hourly', 'daily', 'monthly', 'yearly') DEFAULT 'hourly',
    status ENUM('active', 'completed', 'cancelled', 'expired') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- 5.1 Subscription Plans
CREATE TABLE subscription_plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_days INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    plan_type ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Passes
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
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- 7. Payment Transactions
CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    violation_id INT UNSIGNED NULL,
    booking_id INT UNSIGNED NULL,
    pass_id INT UNSIGNED NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'online', 'bank_transfer') DEFAULT 'cash',
    transaction_id VARCHAR(100) UNIQUE,
    payer_name VARCHAR(100),
    payer_email VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE CASCADE
);

-- 8. Interaction Logs
CREATE TABLE support_tickets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    subject VARCHAR(150),
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chatbot_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    message TEXT,
    response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. Settings
CREATE TABLE settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert Sample Data

-- Admin: admin/admin123
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@smartparking.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'MCD Administrator', 'admin'),
('officer1', 'officer1@mcd.gov.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'Rajesh Kumar', 'officer'),
('viewer1', 'viewer@gmail.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'General Visitor', 'viewer');

-- 10 Parking Zones
INSERT INTO parking_zones (name, address, latitude, longitude, total_capacity, current_occupancy, contractor_limit, contractor_name, contractor_contact, contractor_email, hourly_rate, penalty_per_vehicle, operating_hours, status) VALUES
('Connaught Place Block A', 'Inner Circle, CP, New Delhi', 28.6328, 77.2197, 150, 120, 140, 'CP Traders Association', '919876543210', 'contact@cptrans.org', 80.00, 1000.00, '08:00 - 22:00', 'active'),
('Lajpat Nagar Market', 'Near Metro Stn, New Delhi', 28.5677, 77.2433, 200, 195, 180, 'Lajpat Contractors Ltd', '919811223344', 'parking@lajpat.com', 60.00, 800.00, '10:00 - 21:00', 'active'),
('Rohini Sector 7', 'Main Market Road, Delhi', 28.7161, 77.1171, 100, 45, 90, 'Rohini Civic Society', '918800776655', 'admin@rohinicivic.in', 40.00, 500.00, '06:00 - 23:00', 'active'),
('Janakpuri District Center', 'West Delhi, Delhi', 28.6289, 77.0788, 300, 250, 280, 'Janakpuri Mgmt Group', '919999888777', 'dc@janakpuri.com', 50.00, 750.00, '09:00 - 22:00', 'active'),
('Hauz Khas Village', 'South Delhi, New Delhi', 28.5523, 77.2039, 80, 78, 70, 'HKV Heritage Trust', '917766554433', 'parking@hkv.org', 100.00, 1500.00, '11:00 - 01:00', 'active'),
('Karol Bagh Main Market', 'Padam Singh Road, Delhi', 28.6443, 77.1878, 250, 240, 220, 'Bagga Contractors', '919000111222', 'karol@bagga.com', 70.00, 900.00, '10:00 - 21:30', 'active'),
('Dwarka Sector 10', 'Near Metro Station, New Delhi', 28.5815, 77.0592, 180, 110, 160, 'Dwarka SafePark', '918888777666', 'service@dwarkapark.com', 45.00, 600.00, '05:00 - 23:59', 'active'),
('Vasant Kunj DLF Mall', 'Nelson Mandela Marg, New Delhi', 28.5413, 77.1557, 400, 320, 380, 'DLF Parking Mgmt', '911122334455', 'mall@dlf.com', 90.00, 1200.00, '09:00 - 23:00', 'active'),
('Saket District Centre', 'Select City Road, New Delhi', 28.5283, 77.2185, 350, 310, 330, 'Saket Urban Plan', '919212345678', 'sdc@saket.gov', 85.00, 1100.00, '08:00 - 22:00', 'active'),
('Okhla Phase III', 'Corporate Park, New Delhi', 28.5463, 77.2732, 500, 210, 450, 'Okhla Industries Ltd', '911204445556', 'info@okhla.com', 30.00, 500.00, '08:00 - 20:00', 'active');

-- Sample Slots for Zone 1
INSERT INTO parking_slots (zone_id, slot_number, slot_type, status) VALUES
(1, 'A-101', 'car', 'available'),
(1, 'A-102', 'car', 'occupied'),
(1, 'A-103', 'ev', 'available'),
(1, 'A-104', 'disabled', 'available');

-- Sample Violations
INSERT INTO violations (zone_id, severity, excess_vehicles, penalty_amount, timestamp, resolved, auto_generated) VALUES
(2, 'critical', 15, 12000.00, DATE_SUB(NOW(), INTERVAL 1 HOUR), FALSE, TRUE),
(5, 'warning', 8, 12000.00, DATE_SUB(NOW(), INTERVAL 2 DAY), FALSE, TRUE);

-- Initial Settings
INSERT INTO settings (setting_key, setting_value, setting_type, category, description) VALUES
('system_name', 'MCD Smart Parking System', 'string', 'general', 'Portal Branding'),
('violation_buffer', '90', 'number', 'enforcement', 'Percentage before alert');

-- Sample Subscription Plans
INSERT INTO subscription_plans (name, description, duration_days, price, plan_type) VALUES
('Monthly Basic', 'Unlimited parking in chosen zone for 30 days', 30, 2500.00, 'monthly'),
('Quarterly Saver', 'Unlimited parking in chosen zone for 90 days', 90, 6500.00, 'quarterly'),
('Yearly Premium', 'Unlimited parking in all zones for 365 days', 365, 22000.00, 'yearly');

SELECT 'Railway Database Setup Complete!' as Status;
