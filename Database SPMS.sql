-- ============================================
-- SMART PARKING DATABASE COMPLETE SETUP
-- Database: smartparking
-- User: root
-- Password: admin123
-- ============================================

-- Step 1: Create the database

CREATE DATABASE smartparking 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE smartparking;

-- Step 2: Create parking_zones table
CREATE TABLE parking_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_total_capacity CHECK (total_capacity BETWEEN 1 AND 5000),
    CONSTRAINT chk_current_occupancy CHECK (current_occupancy >= 0 AND current_occupancy <= total_capacity),
    CONSTRAINT chk_contractor_limit CHECK (contractor_limit >= 1 AND contractor_limit <= total_capacity),
    CONSTRAINT chk_hourly_rate CHECK (hourly_rate >= 0),
    CONSTRAINT chk_penalty CHECK (penalty_per_vehicle >= 0)
);

-- Step 3: Create violations table
CREATE TABLE violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zone_id INT NOT NULL,
    severity ENUM('warning', 'critical') NOT NULL,
    excess_vehicles INT NOT NULL,
    penalty_amount DECIMAL(10, 2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    notes TEXT,
    auto_generated BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (zone_id) 
        REFERENCES parking_zones(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_excess_vehicles CHECK (excess_vehicles >= 1),
    CONSTRAINT chk_penalty_amount CHECK (penalty_amount >= 0)
);

-- Step 4: Create additional tables for enhanced functionality

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'contractor', 'officer', 'viewer') DEFAULT 'viewer',
    phone VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit log for tracking changes
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'online', 'bank_transfer') DEFAULT 'cash',
    transaction_id VARCHAR(100) UNIQUE,
    payer_name VARCHAR(100),
    payer_email VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (violation_id) 
        REFERENCES violations(id) 
        ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_zone_timestamp ON violations(zone_id, timestamp DESC);
CREATE INDEX idx_resolved_severity ON violations(resolved, severity);
CREATE INDEX idx_timestamp ON violations(timestamp DESC);
CREATE INDEX idx_zone_status ON parking_zones(status);
CREATE INDEX idx_zone_occupancy ON parking_zones(current_occupancy DESC);
CREATE INDEX idx_contractor_name ON parking_zones(contractor_name);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_payment_status ON payments(status);
CREATE INDEX idx_payment_date ON payments(payment_date DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_table ON audit_logs(table_name, record_id);

-- Step 6: Insert initial settings
INSERT INTO settings (setting_key, setting_value, setting_type, category, description) VALUES
('system_name', 'Smart Parking System', 'string', 'general', 'Name of the parking management system'),
('default_hourly_rate', '50', 'number', 'pricing', 'Default hourly parking rate'),
('default_penalty_per_vehicle', '500', 'number', 'pricing', 'Default penalty per excess vehicle'),
('violation_buffer_percentage', '85', 'number', 'violation', 'Percentage of contractor limit to trigger warning'),
('auto_generate_violations', 'true', 'boolean', 'violation', 'Automatically generate violations when limits exceeded'),
('notification_email', 'admin@smartparking.com', 'string', 'notification', 'Email for system notifications'),
('max_login_attempts', '5', 'number', 'security', 'Maximum allowed login attempts');

-- Step 7: Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@smartparking.com', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'admin');

-- Step 8: Insert sample parking zones
INSERT INTO parking_zones (name, address, latitude, longitude, total_capacity, current_occupancy, contractor_limit, contractor_name, contractor_contact, contractor_email, hourly_rate, penalty_per_vehicle, operating_hours, status) VALUES
('Downtown Central Parking', '123 Main Street, City Center', 40.712776, -74.005974, 200, 185, 180, 'City Contractors Inc.', '+1-555-0101', 'contact@citycontractors.com', 60.00, 750.00, '06:00 - 22:00', 'active'),
('Mall Plaza Parking', '456 Shopping Avenue', 40.758896, -73.985130, 500, 475, 450, 'Mall Management Group', '+1-555-0102', 'parking@mallmgmt.com', 70.00, 850.00, '08:00 - 23:00', 'active'),
('Tech Park Zone A', '789 Innovation Drive', 37.774929, -122.419418, 300, 275, 250, 'Tech Park Authority', '+1-555-0103', 'parking@techpark.com', 80.00, 1000.00, '00:00 - 23:59', 'active'),
('University North Campus', '101 College Road', 34.068921, -118.445181, 400, 320, 350, 'University Services', '+1-555-0104', 'parking@university.edu', 40.00, 500.00, '07:00 - 22:00', 'active'),
('Hospital Emergency Parking', '222 Medical Center Drive', 40.791347, -73.953842, 150, 140, 120, 'Hospital Admin', '+1-555-0105', 'parking@hospital.org', 30.00, 1000.00, '00:00 - 23:59', 'active'),
('Airport Terminal A', '333 Airport Road', 40.641311, -73.778139, 800, 650, 700, 'Airport Authority', '+1-555-0106', 'parking@airport.com', 100.00, 1500.00, '00:00 - 23:59', 'active'),
('Stadium West Parking', '444 Sports Avenue', 40.829643, -73.926175, 1000, 450, 800, 'Stadium Management', '+1-555-0107', 'parking@stadium.com', 90.00, 1200.00, '10:00 - 23:00', 'active'),
('Business District Parking', '555 Corporate Street', 40.757977, -73.985542, 350, 300, 300, 'Business District Corp', '+1-555-0108', 'parking@businessdistrict.com', 75.00, 900.00, '06:00 - 20:00', 'active'),
('Shopping Center Parking', '666 Retail Boulevard', 40.750504, -73.993438, 600, 520, 500, 'Retail Management', '+1-555-0109', 'parking@shoppingcenter.com', 65.00, 800.00, '09:00 - 21:00', 'active'),
('Residential Complex Parking', '777 Living Street', 40.783060, -73.971249, 250, 180, 200, 'Residential Association', '+1-555-0110', 'parking@residential.com', 45.00, 600.00, '00:00 - 23:59', 'active');

-- Step 9: Insert sample violations
INSERT INTO violations (zone_id, severity, excess_vehicles, penalty_amount, timestamp, resolved, resolved_at, notes, auto_generated) VALUES
(1, 'critical', 15, 11250.00, DATE_SUB(NOW(), INTERVAL 5 DAY), FALSE, NULL, 'Automatically generated: 15 vehicles over limit', TRUE),
(2, 'critical', 25, 21250.00, DATE_SUB(NOW(), INTERVAL 3 DAY), FALSE, NULL, 'Automatically generated: 25 vehicles over limit', TRUE),
(3, 'critical', 25, 25000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE, NULL, 'Automatically generated: 25 vehicles over limit', TRUE),
(5, 'critical', 20, 20000.00, DATE_SUB(NOW(), INTERVAL 2 DAY), TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Resolved after contractor cleared vehicles', TRUE),
(6, 'warning', 10, 15000.00, DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Warning issued, vehicles cleared within 2 hours', TRUE),
(1, 'warning', 5, 3750.00, DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE, NULL, 'Automatically generated: 5 vehicles over limit', TRUE);

-- Step 10: Insert sample payments
INSERT INTO payments (violation_id, amount, payment_method, transaction_id, payer_name, payer_email, status, payment_date) VALUES
(5, 20000.00, 'online', 'PAY-001-2024', 'Hospital Admin', 'billing@hospital.org', 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 15000.00, 'bank_transfer', 'PAY-002-2024', 'Airport Authority', 'finance@airport.com', 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Step 11: Create views for common queries

-- View for zones with violations
CREATE VIEW zones_with_violations AS
SELECT 
    pz.*,
    COUNT(v.id) as total_violations,
    SUM(CASE WHEN v.resolved = FALSE THEN 1 ELSE 0 END) as unresolved_violations,
    SUM(CASE WHEN v.resolved = FALSE THEN v.penalty_amount ELSE 0 END) as outstanding_penalty,
    MAX(v.timestamp) as latest_violation_date
FROM parking_zones pz
LEFT JOIN violations v ON pz.id = v.zone_id
GROUP BY pz.id;

-- View for violation statistics
CREATE VIEW violation_statistics AS
SELECT 
    DATE(v.timestamp) as violation_date,
    COUNT(*) as total_violations,
    SUM(v.excess_vehicles) as total_excess_vehicles,
    SUM(v.penalty_amount) as total_penalty_amount,
    AVG(v.excess_vehicles) as avg_excess_vehicles,
    SUM(CASE WHEN v.resolved = TRUE THEN 1 ELSE 0 END) as resolved_violations,
    SUM(CASE WHEN v.resolved = FALSE THEN 1 ELSE 0 END) as pending_violations
FROM violations v
GROUP BY DATE(v.timestamp)
ORDER BY violation_date DESC;

-- View for contractor performance
CREATE VIEW contractor_performance AS
SELECT 
    pz.contractor_name,
    COUNT(DISTINCT pz.id) as zones_managed,
    SUM(pz.total_capacity) as total_capacity_managed,
    AVG(pz.current_occupancy * 100.0 / pz.total_capacity) as avg_occupancy_rate,
    COUNT(v.id) as total_violations,
    SUM(CASE WHEN v.resolved = FALSE THEN 1 ELSE 0 END) as unresolved_violations,
    SUM(v.penalty_amount) as total_penalty_issued,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_payment_received
FROM parking_zones pz
LEFT JOIN violations v ON pz.id = v.zone_id
LEFT JOIN payments p ON v.id = p.violation_id
GROUP BY pz.contractor_name
ORDER BY total_violations DESC;

-- Step 12: Create stored procedures

-- Procedure to update zone occupancy
DELIMITER $$
CREATE PROCEDURE update_zone_occupancy(
    IN zone_id INT,
    IN occupancy_change INT,
    IN user_id INT
)
BEGIN
    DECLARE current_occ INT;
    DECLARE new_occ INT;
    DECLARE total_cap INT;
    DECLARE cont_limit INT;
    DECLARE penalty_rate DECIMAL(10,2);
    DECLARE zone_name VARCHAR(100);
    DECLARE excess INT;
    
    -- Get current values
    SELECT current_occupancy, total_capacity, contractor_limit, penalty_per_vehicle, name
    INTO current_occ, total_cap, cont_limit, penalty_rate, zone_name
    FROM parking_zones 
    WHERE id = zone_id;
    
    -- Calculate new occupancy
    SET new_occ = current_occ + occupancy_change;
    
    -- Validate
    IF new_occ < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Occupancy cannot be negative';
    END IF;
    
    IF new_occ > total_cap THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Occupancy cannot exceed total capacity';
    END IF;
    
    -- Update occupancy
    UPDATE parking_zones 
    SET current_occupancy = new_occ 
    WHERE id = zone_id;
    
    -- Check for violation
    SET excess = new_occ - cont_limit;
    
    IF excess > 0 THEN
        -- Check if there's already an active violation
        IF NOT EXISTS (
            SELECT 1 FROM violations 
            WHERE zone_id = zone_id 
            AND resolved = FALSE
        ) THEN
            -- Create new violation
            INSERT INTO violations (
                zone_id, 
                severity, 
                excess_vehicles, 
                penalty_amount,
                notes
            ) VALUES (
                zone_id,
                CASE WHEN excess > cont_limit * 0.3 THEN 'critical' ELSE 'warning' END,
                excess,
                excess * penalty_rate,
                CONCAT('Auto-generated: Zone occupancy (', new_occ, ') exceeded contractor limit (', cont_limit, ')')
            );
            
            -- Log the action
            INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
            VALUES (
                user_id,
                'VIOLATION_CREATED',
                'violations',
                LAST_INSERT_ID(),
                JSON_OBJECT(
                    'zone_id', zone_id,
                    'zone_name', zone_name,
                    'excess_vehicles', excess,
                    'penalty_amount', excess * penalty_rate
                )
            );
        END IF;
    END IF;
    
    -- Log the occupancy change
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
        user_id,
        'OCCUPANCY_UPDATED',
        'parking_zones',
        zone_id,
        JSON_OBJECT(
            'old_occupancy', current_occ,
            'new_occupancy', new_occ,
            'change', occupancy_change
        )
    );
    
    SELECT 'Success' as status, new_occ as new_occupancy, excess as excess_vehicles;
END$$
DELIMITER ;

-- Procedure to resolve violation
DELIMITER $$
CREATE PROCEDURE resolve_violation(
    IN violation_id INT,
    IN user_id INT,
    IN resolution_notes TEXT
)
BEGIN
    DECLARE v_zone_id INT;
    DECLARE v_penalty_amount DECIMAL(10,2);
    
    -- Get violation details
    SELECT zone_id, penalty_amount 
    INTO v_zone_id, v_penalty_amount
    FROM violations 
    WHERE id = violation_id AND resolved = FALSE;
    
    IF v_zone_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Violation not found or already resolved';
    END IF;
    
    -- Update violation
    UPDATE violations 
    SET 
        resolved = TRUE,
        resolved_at = NOW(),
        notes = CONCAT(COALESCE(notes, ''), '\nResolved: ', resolution_notes)
    WHERE id = violation_id;
    
    -- Log the action
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
        user_id,
        'VIOLATION_RESOLVED',
        'violations',
        violation_id,
        JSON_OBJECT(
            'resolved_at', NOW(),
            'resolution_notes', resolution_notes
        )
    );
    
    SELECT 'Success' as status, v_penalty_amount as penalty_amount;
END$$
DELIMITER ;

-- Procedure to generate daily report
DELIMITER $$
CREATE PROCEDURE generate_daily_report(
    IN report_date DATE
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    SET start_date = COALESCE(report_date, CURDATE());
    SET end_date = start_date;
    
    SELECT 
        start_date as report_date,
        COUNT(DISTINCT pz.id) as total_zones,
        SUM(pz.total_capacity) as total_capacity,
        SUM(pz.current_occupancy) as total_occupancy,
        ROUND(AVG(pz.current_occupancy * 100.0 / pz.total_capacity), 2) as avg_occupancy_rate,
        COUNT(v.id) as violations_today,
        SUM(v.excess_vehicles) as total_excess_vehicles,
        SUM(v.penalty_amount) as total_penalty_amount,
        COUNT(CASE WHEN v.resolved = TRUE THEN 1 END) as resolved_violations,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as payments_received,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_payments_amount
    FROM parking_zones pz
    LEFT JOIN violations v ON pz.id = v.zone_id AND DATE(v.timestamp) = start_date
    LEFT JOIN payments p ON v.id = p.violation_id AND DATE(p.payment_date) = start_date;
END$$
DELIMITER ;

-- Step 13: Create triggers

-- Trigger to log changes to parking_zones
DELIMITER $$
CREATE TRIGGER parking_zones_audit
AFTER UPDATE ON parking_zones
FOR EACH ROW
BEGIN
    IF OLD.current_occupancy != NEW.current_occupancy THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (
            'parking_zones',
            NEW.id,
            'OCCUPANCY_CHANGED',
            JSON_OBJECT('current_occupancy', OLD.current_occupancy),
            JSON_OBJECT('current_occupancy', NEW.current_occupancy)
        );
    END IF;
END$$
DELIMITER ;

-- Trigger to update zone status based on occupancy
DELIMITER $$
CREATE TRIGGER update_zone_status
BEFORE UPDATE ON parking_zones
FOR EACH ROW
BEGIN
    -- Update status to 'full' if occupancy reaches capacity
    IF NEW.current_occupancy >= NEW.total_capacity AND NEW.status != 'maintenance' THEN
        SET NEW.status = 'active'; -- You can change to 'full' if you add that status
    END IF;
    
    -- Update timestamp
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- Step 14: Create functions

-- Function to calculate available spots
DELIMITER $$
CREATE FUNCTION calculate_available_spots(zone_id INT) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE total INT;
    DECLARE occupied INT;
    
    SELECT total_capacity, current_occupancy 
    INTO total, occupied
    FROM parking_zones 
    WHERE id = zone_id;
    
    RETURN total - occupied;
END$$
DELIMITER ;

-- Function to check if zone is violating
DELIMITER $$
CREATE FUNCTION is_zone_violating(zone_id INT) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE occupancy INT;
    DECLARE limit_val INT;
    
    SELECT current_occupancy, contractor_limit 
    INTO occupancy, limit_val
    FROM parking_zones 
    WHERE id = zone_id;
    
    RETURN occupancy > limit_val;
END$$
DELIMITER ;

-- Step 15: Verify the setup
SELECT 'Database setup completed successfully!' as message;

-- Show all tables
SHOW TABLES;

-- Show table structures
DESCRIBE parking_zones;
DESCRIBE violations;
DESCRIBE users;
DESCRIBE payments;

-- Count records
SELECT 
    (SELECT COUNT(*) FROM parking_zones) as parking_zones_count,
    (SELECT COUNT(*) FROM violations) as violations_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM payments) as payments_count;