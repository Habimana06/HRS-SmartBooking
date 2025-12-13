-- Create table for PBAC role definitions if it does not exist
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE RolePermissions (
        RolePermissionId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        Color NVARCHAR(32) NULL,
        Permissions NVARCHAR(MAX) NOT NULL,
        Disabled BIT NOT NULL DEFAULT 0,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- Upsert default PBAC roles and permissions
MERGE RolePermissions AS target
USING (VALUES
    ('Admin', 'Full administrative access', 'red', '["admin:dashboard:view","admin:users:manage","admin:roles:manage","admin:staff:manage","admin:payments:view","admin:reports:view","admin:reports:download","admin:audit:view","admin:config:manage","admin:security:manage","admin:backup:manage","admin:profile:update"]', 0),
    ('Manager', 'Manage rooms, bookings, reports', 'blue', '["manager:dashboard:view","manager:rooms:view","manager:rooms:manage","manager:rooms:create","manager:bookings:view","manager:bookings:manage","manager:travel:manage","manager:reports:view","manager:reports:download","manager:staff:view","manager:profile:update"]', 0),
    ('Receptionist', 'Handle guest check-ins, bookings, and requests', 'green', '["receptionist:dashboard:view","receptionist:bookings:view","receptionist:bookings:manage","receptionist:checkin","receptionist:checkout","receptionist:travel:view","receptionist:requests:handle","receptionist:profile:update"]', 0),
    ('Customer', 'Create and manage own bookings', 'purple', '["customer:dashboard:view","customer:booking:create","customer:booking:view","customer:payments:pay","customer:profile:update"]', 0)
) AS source (Name, Description, Color, Permissions, Disabled)
ON target.Name = source.Name
WHEN MATCHED THEN
    UPDATE SET
        target.Description = source.Description,
        target.Color = source.Color,
        target.Permissions = source.Permissions,
        target.Disabled = source.Disabled,
        target.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (Name, Description, Color, Permissions, Disabled, UpdatedAt)
    VALUES (source.Name, source.Description, source.Color, source.Permissions, source.Disabled, SYSUTCDATETIME());
GO

