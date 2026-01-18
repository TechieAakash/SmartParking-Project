-- Check current database structure
USE smartparking;

-- Check if users table exists and its structure
SHOW CREATE TABLE users;

-- Check if passes table exists
SHOW TABLES LIKE 'passes';

-- If passes exists, check its structure
SHOW CREATE TABLE passes;

-- Check the exact data type of users.id
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'smartparking' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'id';

-- Check if passes table exists and its user_id column
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'smartparking' 
    AND TABLE_NAME = 'passes' 
    AND COLUMN_NAME IN ('user_id', 'id');
