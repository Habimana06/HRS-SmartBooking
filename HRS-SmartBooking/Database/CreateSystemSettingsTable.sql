-- Create SystemSettings table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemSettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SystemSettings] (
        [setting_id] INT IDENTITY(1,1) PRIMARY KEY,
        [setting_key] NVARCHAR(100) NOT NULL,
        [setting_value] NVARCHAR(500) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [UQ_SystemSettings_SettingKey] UNIQUE ([setting_key])
    );

    -- Create index on setting_key for faster lookups
    CREATE INDEX [IX_SystemSettings_SettingKey] ON [dbo].[SystemSettings]([setting_key]);

    -- Insert default currency setting as RWF
    INSERT INTO [dbo].[SystemSettings] ([setting_key], [setting_value], [created_at], [updated_at])
    VALUES ('Currency', 'RWF', GETDATE(), GETDATE());

    PRINT 'SystemSettings table created successfully with default currency RWF';
END
ELSE
BEGIN
    -- If table exists, ensure currency setting exists with RWF as default
    IF NOT EXISTS (SELECT * FROM [dbo].[SystemSettings] WHERE [setting_key] = 'Currency')
    BEGIN
        INSERT INTO [dbo].[SystemSettings] ([setting_key], [setting_value], [created_at], [updated_at])
        VALUES ('Currency', 'RWF', GETDATE(), GETDATE());
        PRINT 'Currency setting added with default value RWF';
    END
    ELSE
    BEGIN
        -- Update existing currency to RWF if it's USD
        UPDATE [dbo].[SystemSettings]
        SET [setting_value] = 'RWF', [updated_at] = GETDATE()
        WHERE [setting_key] = 'Currency' AND [setting_value] = 'USD';
        PRINT 'Currency setting updated to RWF';
    END
END
GO

