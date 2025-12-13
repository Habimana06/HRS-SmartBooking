-- Create ChatMessages table for customer-receptionist chat functionality
-- SQL Server version
-- Run this query in your SQL Server database

-- Drop table if it exists (optional - remove if you want to keep existing data)
IF OBJECT_ID('ChatMessages', 'U') IS NOT NULL
    DROP TABLE ChatMessages;
GO

-- Create the ChatMessages table without foreign keys first
CREATE TABLE ChatMessages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    receptionist_id INT NULL,
    message_text NVARCHAR(2000) NOT NULL,
    is_from_customer BIT NOT NULL DEFAULT 1,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    read_at DATETIME NULL
);
GO

-- Create indexes for better query performance
CREATE INDEX idx_customer_id ON ChatMessages(customer_id);
CREATE INDEX idx_receptionist_id ON ChatMessages(receptionist_id);
CREATE INDEX idx_created_at ON ChatMessages(created_at);
CREATE INDEX idx_is_read ON ChatMessages(is_read);
GO

-- Add foreign key constraints separately (using NO ACTION to avoid cascade path issues)
IF OBJECT_ID('FK_ChatMessage_Customer', 'F') IS NOT NULL
    ALTER TABLE ChatMessages DROP CONSTRAINT FK_ChatMessage_Customer;
GO

ALTER TABLE ChatMessages
ADD CONSTRAINT FK_ChatMessage_Customer 
    FOREIGN KEY (customer_id) 
    REFERENCES Users(user_id) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
GO

IF OBJECT_ID('FK_ChatMessage_Receptionist', 'F') IS NOT NULL
    ALTER TABLE ChatMessages DROP CONSTRAINT FK_ChatMessage_Receptionist;
GO

ALTER TABLE ChatMessages
ADD CONSTRAINT FK_ChatMessage_Receptionist 
    FOREIGN KEY (receptionist_id) 
    REFERENCES Users(user_id) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
GO

-- Add table comment (optional)
IF EXISTS (SELECT 1 FROM sys.extended_properties WHERE major_id = OBJECT_ID('ChatMessages') AND minor_id = 0 AND name = 'MS_Description')
    EXEC sp_dropextendedproperty 
        @name = N'MS_Description', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'ChatMessages';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores chat messages between customers and receptionists', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'ChatMessages';
GO
