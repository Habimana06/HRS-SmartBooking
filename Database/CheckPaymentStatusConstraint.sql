-- Query to check the CHECK constraint definition for payment_status in Bookings table
-- Run this query in SQL Server Management Studio to see what values are allowed

-- This query shows the FULL constraint definition (not truncated)
SELECT 
    cc.name AS ConstraintName,
    OBJECT_NAME(cc.parent_object_id) AS TableName,
    COL_NAME(cc.parent_object_id, cc.parent_column_id) AS ColumnName,
    cc.definition AS ConstraintDefinition
FROM 
    sys.check_constraints cc
WHERE 
    cc.name LIKE '%paymen%'
    AND OBJECT_NAME(cc.parent_object_id) = 'Bookings'
    AND COL_NAME(cc.parent_object_id, cc.parent_column_id) = 'payment_status';

-- Alternative: Get full definition using OBJECT_DEFINITION (shows full text)
SELECT 
    cc.name AS ConstraintName,
    OBJECT_DEFINITION(cc.object_id) AS FullConstraintDefinition
FROM 
    sys.check_constraints cc
    INNER JOIN sys.objects o ON cc.parent_object_id = o.object_id
WHERE 
    cc.name LIKE '%paymen%'
    AND o.name = 'Bookings';

-- Alternative query to see all CHECK constraints on Bookings table
SELECT 
    cc.name AS ConstraintName,
    cc.definition AS ConstraintDefinition
FROM 
    sys.check_constraints cc
    INNER JOIN sys.objects o ON cc.parent_object_id = o.object_id
WHERE 
    o.name = 'Bookings';

-- Query to see what payment_status values currently exist in Bookings table
SELECT DISTINCT payment_status, COUNT(*) AS Count
FROM Bookings
GROUP BY payment_status;

-- IMPORTANT: Get the FULL constraint definition (use Results to Text mode to see full definition)
-- Instructions: In SSMS, go to Query menu -> Query Options -> Results -> Text
-- OR right-click in Results pane -> Results to -> Results to Text (Ctrl+T)
-- This will show the FULL constraint definition without truncation
SELECT 
    cc.name AS ConstraintName,
    OBJECT_NAME(cc.parent_object_id) AS TableName,
    OBJECT_DEFINITION(cc.object_id) AS FullConstraintDefinition
FROM 
    sys.check_constraints cc
    INNER JOIN sys.objects o ON cc.parent_object_id = o.object_id
WHERE 
    o.name = 'Bookings'
    AND COL_NAME(cc.parent_object_id, cc.parent_column_id) = 'payment_status';

-- SIMPLE QUERY: Just get the constraint name and definition for Bookings.payment_status
-- Run this in Results to Text mode (Ctrl+T) to see full definition
SELECT 
    'Constraint Name: ' + cc.name AS Info,
    'Full Definition: ' + OBJECT_DEFINITION(cc.object_id) AS ConstraintDefinition
FROM 
    sys.check_constraints cc
    INNER JOIN sys.objects o ON cc.parent_object_id = o.object_id
WHERE 
    o.name = 'Bookings'
    AND cc.name LIKE '%paymen%';
