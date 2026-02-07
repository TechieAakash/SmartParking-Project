-- Fix wallet_transactions ENUM to include 'refund'
-- Run this in MySQL Workbench or command line

USE smartparking;

-- Alter the transaction_type ENUM to add 'refund'
ALTER TABLE wallet_transactions 
MODIFY COLUMN transaction_type ENUM('credit', 'debit', 'refund') NOT NULL;

SELECT 'wallet_transactions ENUM updated successfully!' AS Status;
