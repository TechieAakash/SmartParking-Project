-- Fix bookings table schema to match application requirements
-- Run this in your MySQL client

USE smartparking;

-- Add missing columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS zone_id INT UNSIGNED,
ADD COLUMN IF NOT EXISTS start_time DATETIME,
ADD COLUMN IF NOT EXISTS end_time DATETIME,
ADD COLUMN IF NOT EXISTS duration INT,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS booking_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100);

-- Update existing records to use new columns if old columns exist
-- This maps old column values to new columns
UPDATE bookings SET zone_id = slot_id WHERE zone_id IS NULL AND slot_id IS NOT NULL;
UPDATE bookings SET start_time = booking_start WHERE start_time IS NULL AND booking_start IS NOT NULL;
UPDATE bookings SET end_time = booking_end WHERE end_time IS NULL AND booking_end IS NOT NULL;

-- Modify status enum to include 'pending'
ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'active', 'completed', 'cancelled', 'expired') DEFAULT 'pending';

-- Add foreign key for zone_id if it doesn't exist
-- ALTER TABLE bookings ADD FOREIGN KEY (zone_id) REFERENCES parking_zones(id) ON DELETE SET NULL;

SELECT 'Bookings table updated successfully!' as result;
