-- Smart Parking Management System - Database Schema
-- Run this SQL script in MySQL Workbench to create all tables

-- Create database (if not already created)
CREATE DATABASE IF NOT EXISTS smartpark;
USE smartpark;

-- Drop tables if they exist (for fresh installation)
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS passes;
DROP TABLE IF EXISTS penalties;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS parking_slots;
DROP TABLE IF EXISTS parking_zones;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    mcd_govt_id VARCHAR(50),
    role ENUM('user', 'officer', 'admin') DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles table
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type ENUM('car', 'bike', 'truck', 'bus', 'ev') DEFAULT 'car',
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parking Zones table
CREATE TABLE parking_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    total_slots INT DEFAULT 0 NOT NULL,
    occupied_slots INT DEFAULT 0 NOT NULL,
    price_per_hour DECIMAL(10, 2) DEFAULT 20.00 NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active' NOT NULL,
    contractor_name VARCHAR(100),
    contractor_phone VARCHAR(15),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parking Slots table
CREATE TABLE parking_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zone_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    slot_type ENUM('regular', 'disabled', 'ev_charging', 'vip') DEFAULT 'regular',
    status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available' NOT NULL,
    vehicle_number VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE,
    UNIQUE KEY unique_slot (zone_id, slot_number),
    INDEX idx_zone_status (zone_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    zone_id INT NOT NULL,
    slot_id INT,
    vehicle_id INT,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('car', 'bike', 'truck', 'bus', 'ev') DEFAULT 'car',
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INT COMMENT 'Duration in minutes',
    amount DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_zone_date (zone_id, start_time),
    INDEX idx_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Penalties table
CREATE TABLE penalties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    zone_id INT NOT NULL,
    booking_id INT,
    vehicle_number VARCHAR(20) NOT NULL,
    violation_type ENUM('overstay', 'no_ticket', 'wrong_zone', 'other') NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) DEFAULT 100.00 NOT NULL,
    status ENUM('pending', 'paid', 'waived', 'appealed') DEFAULT 'pending' NOT NULL,
    issued_by INT,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_vehicle (vehicle_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Passes table
-- Subscription Plans table
CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_days INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    plan_type ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Passes table
CREATE TABLE passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    zone_id INT NOT NULL,
    plan_id INT,
    vehicle_id INT,
    pass_type ENUM('monthly', 'yearly') NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_vehicle (vehicle_number),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT,
    penalty_id INT,
    pass_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'wallet') NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (penalty_id) REFERENCES penalties(id) ON DELETE SET NULL,
    FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Tickets table
CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('booking', 'payment', 'penalty', 'technical', 'other') DEFAULT 'other',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open' NOT NULL,
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_priority (priority),
    INDEX idx_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@smartpark.com', '$2a$10$YyJXKl7Y8qZ8q7Z8q7Z8qOXKl7Y8qZ8q7Z8q7Z8qOXKl7Y8qZ8q7O', 'System Administrator', 'admin');

-- Insert sample parking zones
INSERT INTO parking_zones (name, location, latitude, longitude, total_slots, price_per_hour, contractor_name, contractor_phone, description) VALUES
('Connaught Place Zone A', 'Connaught Place, New Delhi', 28.631699, 77.219093, 50, 30.00, 'Delhi Parking Services', '9876543210', 'Prime location near Connaught Place market'),
('Nehru Place Zone', 'Nehru Place, New Delhi', 28.549524, 77.249375, 100, 25.00, 'South Delhi Contractors', '9876543211', 'IT hub parking zone'),
('Rajiv Chowk Metro', 'Rajiv Chowk Metro Station', 28.632836, 77.219560, 75, 20.00, 'Metro Parking Ltd', '9876543212', 'Metro station parking facility'),
('India Gate Zone', 'India Gate, New Delhi', 28.612894, 77.229446, 40, 35.00, 'Heritage Zone Services', '9876543213', 'Tourist area premium parking');

COMMIT;

-- Display success message
SELECT 'Database schema created successfully!' AS Status;
SELECT COUNT(*) AS 'Total Zones' FROM parking_zones;
SELECT COUNT(*) AS 'Total Users' FROM users;
