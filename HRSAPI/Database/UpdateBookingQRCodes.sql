-- SQL Script to Update Existing Bookings with Unique QR Codes
-- This script generates unique QR codes for all bookings that don't have one or have duplicate QR codes
-- QR Code Format: BK-{booking_id}-{timestamp}-{random}

USE HotelReservationDB;
GO

-- Step 1: Update bookings with NULL or empty QR codes
-- Format: BK-{customer_id}-{room_id}-{timestamp}-{random}
UPDATE Bookings
SET qr_code = 'BK-' + CAST(customer_id AS VARCHAR(10)) + '-' + 
             CAST(room_id AS VARCHAR(10)) + '-' + 
             FORMAT(created_at, 'yyyyMMddHHmmss') + '-' + 
             UPPER(SUBSTRING(REPLACE(NEWID(), '-', ''), 1, 8))
WHERE qr_code IS NULL OR qr_code = '';
GO

-- Step 2: Update bookings with duplicate QR codes (keep the oldest booking's QR code, update others)
WITH DuplicateQRCodes AS (
    SELECT booking_id, qr_code, customer_id, room_id, created_at,
           ROW_NUMBER() OVER (PARTITION BY qr_code ORDER BY created_at ASC) AS rn
    FROM Bookings
    WHERE qr_code IS NOT NULL AND qr_code != ''
)
UPDATE b
SET b.qr_code = 'BK-' + CAST(b.customer_id AS VARCHAR(10)) + '-' + 
                CAST(b.room_id AS VARCHAR(10)) + '-' + 
                FORMAT(b.created_at, 'yyyyMMddHHmmss') + '-' + 
                UPPER(SUBSTRING(REPLACE(NEWID(), '-', ''), 1, 8))
FROM Bookings b
INNER JOIN DuplicateQRCodes d ON b.booking_id = d.booking_id
WHERE d.rn > 1; -- Update all except the first (oldest) occurrence
GO

-- Step 3: Verify all QR codes are unique
SELECT qr_code, COUNT(*) AS count
FROM Bookings
WHERE qr_code IS NOT NULL AND qr_code != ''
GROUP BY qr_code
HAVING COUNT(*) > 1;
-- This query should return 0 rows if all QR codes are unique
GO

-- Step 4: Show summary
SELECT 
    COUNT(*) AS total_bookings,
    SUM(CASE WHEN qr_code IS NOT NULL AND qr_code != '' THEN 1 ELSE 0 END) AS bookings_with_qr,
    SUM(CASE WHEN qr_code IS NULL OR qr_code = '' THEN 1 ELSE 0 END) AS bookings_without_qr
FROM Bookings;
GO

