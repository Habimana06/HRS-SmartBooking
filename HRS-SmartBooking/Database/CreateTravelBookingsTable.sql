-- Create TravelBookings table for travel/attraction bookings
-- SQL Server version

-- Drop table if it exists
IF OBJECT_ID('TravelBookings', 'U') IS NOT NULL
    DROP TABLE TravelBookings;
GO

-- Create the TravelBookings table
CREATE TABLE TravelBookings (
    travel_booking_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    attraction_name NVARCHAR(200) NOT NULL,
    attraction_type NVARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    number_of_participants INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    booking_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method NVARCHAR(50) NULL,
    refund_requested BIT NOT NULL DEFAULT 0,
    refund_requested_at DATETIME NULL,
    refund_approved BIT NULL,
    refund_approved_at DATETIME NULL,
    refund_processed_at DATETIME NULL,
    special_requests NVARCHAR(MAX) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    cancelled_at DATETIME NULL
);
GO

-- Create indexes for better query performance
CREATE INDEX idx_travel_customer_id ON TravelBookings(customer_id);
CREATE INDEX idx_travel_date ON TravelBookings(travel_date);
CREATE INDEX idx_travel_booking_status ON TravelBookings(booking_status);
CREATE INDEX idx_travel_refund_requested ON TravelBookings(refund_requested);
GO

-- Add foreign key constraint
IF OBJECT_ID('FK_TravelBooking_Customer', 'F') IS NOT NULL
    ALTER TABLE TravelBookings DROP CONSTRAINT FK_TravelBooking_Customer;
GO

ALTER TABLE TravelBookings
ADD CONSTRAINT FK_TravelBooking_Customer
    FOREIGN KEY (customer_id)
    REFERENCES Users(user_id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;
GO

