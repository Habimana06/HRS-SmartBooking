# HRS Smart Booking System

A comprehensive Hotel Reservation System built with ASP.NET Core 8.0, featuring role-based access control, multi-currency support, payment processing, travel booking management, and comprehensive reporting capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles & Capabilities](#user-roles--capabilities)
- [Installation & Setup](#installation--setup)
- [Database Configuration](#database-configuration)
- [Core Features](#core-features)
- [Travel Booking System](#travel-booking-system)
- [Feedback & Support System](#feedback--support-system)
- [API & Services](#api--services)
- [Report Export](#report-export)
- [Payment Methods](#payment-methods)
- [Currency Support](#currency-support)
- [File Structure](#file-structure)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Workflows](#workflows)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

HRS Smart Booking is a full-featured hotel and travel management system designed to streamline operations for hotels, resorts, and accommodation providers. The system supports multiple user roles, real-time booking management for both rooms and travel attractions, payment processing, refund management, customer feedback, and comprehensive reporting.

The system handles:
- **Room Reservations**: Complete room booking lifecycle from search to check-out
- **Travel Bookings**: Attraction and experience bookings with refund capabilities
- **Payment Processing**: Multiple payment methods with transaction tracking
- **Customer Feedback**: Reviews, complaints, and support requests
- **Financial Management**: Revenue tracking, reports, and analytics
- **User Management**: Role-based access control for Admin, Manager, Receptionist, and Customer

## ✨ Features

### Core Features
- **Multi-Role Access Control**: Admin, Manager, Receptionist, and Customer roles with granular permissions
- **Room Management**: Complete CRUD operations for rooms and room types with image galleries
- **Travel Booking System**: Book attractions and experiences with refund workflow
- **Booking System**: Real-time availability checking and reservation management
- **Payment Processing**: Support for Card and MTN Mobile Money payments
- **Refund Management**: Request, approve, and process refunds for travel bookings
- **Multi-Currency**: RWF (Rwandan Franc) as base currency with USD display option
- **Image Gallery**: Room image upload and management with auto-sliding carousels
- **Check-in/Check-out**: Automated guest management
- **Reviews & Feedback**: Customer review system with ratings
- **Complaint Management**: Track and resolve customer complaints and support requests
- **Search Functionality**: Advanced room search with filters (dates, guests, room type)
- **Audit Logging**: Complete system activity tracking
- **Report Generation**: Export reports in CSV, PDF, and Excel formats
- **Dashboard Analytics**: Real-time statistics and charts for all roles
- **Responsive Design**: Modern UI/UX with Bootstrap 5 and custom CSS

## 🛠 Technology Stack

- **Framework**: ASP.NET Core 8.0 (Razor Pages)
- **Database**: SQL Server with Entity Framework Core 8.0
- **Authentication**: Session-based with BCrypt password hashing
- **Frontend**: Bootstrap 5, Custom CSS, JavaScript
- **Icons**: Bootstrap Icons
- **Architecture**: MVC Pattern with Service Layer
- **Password Security**: BCrypt with show/hide password toggle

## 🏗 System Architecture

```
HRS-SmartBooking/
├── Pages/              # Razor Pages (Views & Code-behind)
│   ├── Admin/         # Admin portal pages
│   ├── Manager/       # Manager portal pages
│   ├── Receptionist/  # Receptionist portal pages
│   ├── Customer/      # Customer-facing pages
│   ├── Feedback/      # Feedback submission
│   └── Shared/        # Shared layouts and components
├── Models/            # Entity models
│   ├── User.cs
│   ├── Room.cs
│   ├── RoomType.cs
│   ├── Booking.cs
│   ├── Payment.cs
│   ├── TravelBooking.cs
│   ├── Review.cs
│   ├── Complaint.cs
│   └── ...
├── Services/          # Business logic services
│   ├── AuthService.cs
│   ├── BookingService.cs
│   ├── RoomService.cs
│   ├── DashboardService.cs
│   ├── CurrencyHelper.cs
│   └── ReportExportService.cs
├── Data/              # Database context and migrations
│   └── ApplicationDbContext.cs
├── Helpers/           # Utility helpers
│   └── TranslationHelper.cs
├── Attributes/        # Custom attributes
│   └── AuthorizeRoleAttribute.cs
└── wwwroot/           # Static files (CSS, JS, images)
    ├── css/
    ├── js/
    ├── images/
    └── uploads/
```

## 👥 User Roles & Capabilities

### 1. Admin
**Full system access and configuration**

**Pages & Features:**
- **Dashboard** (`/Admin/Dashboard`)
  - Total revenue (rooms + travel bookings)
  - Total bookings (rooms + travel)
  - Today's revenue and bookings
  - Monthly revenue charts
  - System statistics

- **User Management** (`/Admin/UserManagement`)
  - Create, edit, and delete user accounts
  - Assign roles (Admin, Manager, Receptionist, Customer)
  - Activate/deactivate users
  - View user details

- **Roles & Permissions** (`/Admin/RolesPermissions`)
  - View role distribution
  - Manage permissions matrix
  - Role-based access control

- **Staff Management** (`/Admin/StaffManagement`)
  - Manage staff accounts
  - Assign staff to departments
  - View staff performance

- **Travel Bookings** (`/Manager/ManageTravelBookings`)
  - View all travel bookings
  - Monitor travel booking status
  - View refund requests

- **System Configuration** (`/Admin/SystemConfiguration`)
  - Configure currency (RWF/USD)
  - Set payment methods
  - System-wide settings

- **Audit Logs** (`/Admin/AuditLogs`)
  - View all system activities
  - Track user actions
  - Security monitoring

- **Payments & Transactions** (`/Admin/Payments`)
  - View all payments (rooms + travel)
  - Filter by status, date, method
  - Export payment reports (CSV, PDF)
  - Transaction history

- **Reports** (`/Admin/Reports`)
  - Generate system reports
  - Export data
  - Analytics and insights

- **Database Control** (`/Admin/DatabaseControl`)
  - Database management
  - Query execution
  - Data integrity checks

- **Backup & Restore** (`/Admin/BackupRestore`)
  - Create database backups
  - Restore from backups
  - Backup scheduling

- **Security Center** (`/Admin/SecurityCenter`)
  - Security monitoring
  - Threat detection
  - Access logs

- **Profile** (`/Admin/Profile`)
  - Update personal information
  - Change password
  - Account settings

### 2. Manager
**Operational control and management**

**Pages & Features:**
- **Dashboard** (`/Manager/Dashboard`)
  - Today's revenue (rooms + travel)
  - Monthly revenue
  - Total bookings (rooms + travel)
  - Pending refunds
  - Revenue charts

- **Reservations** (`/Manager/ManageBookings`)
  - View all room bookings
  - Filter by status, payment status, date
  - Search bookings
  - Approve/cancel bookings
  - View booking details

- **Travel Bookings** (`/Manager/ManageTravelBookings`)
  - View all travel bookings
  - Create new travel bookings
  - Edit existing travel bookings
  - Delete travel bookings
  - Approve refund requests
  - Filter by status, payment status, refund status
  - Search by customer or attraction

- **Create Travel Booking** (`/Manager/CreateTravelBooking`)
  - Create new travel bookings for customers
  - Edit existing travel bookings
  - Set attraction details, dates, participants
  - Set pricing in RWF

- **Manage Rooms** (`/Manager/ManageRooms`)
  - View all rooms
  - Edit room details
  - Update pricing
  - Manage room images
  - Set availability

- **Add Room** (`/Manager/AddRoom`)
  - Create new rooms
  - Upload room images (multiple)
  - Set room type and pricing
  - Configure amenities

- **Manage Amenities** (`/Manager/ManageAmenities`)
  - Add/edit amenities
  - Assign amenities to rooms
  - Manage amenity categories

- **Manage Room Types** (`/Manager/RoomTypes`)
  - Create/edit room types
  - Set pricing per room type
  - Configure max occupancy
  - Manage room type features

- **Staff Management** (`/Manager/StaffManagement`)
  - Manage receptionist accounts
  - View staff assignments
  - Performance tracking

- **Financial Reports** (`/Manager/FinancialReports`)
  - Revenue reports (rooms + travel)
  - Payment method analysis
  - Export reports (PDF, Excel/CSV)
  - Print reports

- **Customer Feedback** (`/Manager/CustomerFeedback`)
  - View customer reviews (with ratings)
  - View customer complaints/feedback
  - Respond to feedback
  - Track feedback status

- **Profile** (`/Manager/Profile`)
  - Update personal information
  - Change password

### 3. Receptionist
**Front desk operations**

**Pages & Features:**
- **Dashboard** (`/Receptionist/Dashboard`)
  - Today's bookings
  - Check-in/check-out status
  - Travel bookings overview
  - Pending approvals

- **Manage Reservations** (`/Receptionist/ManageReservations`)
  - View room reservations
  - Filter by room type, status, date
  - Approve pending bookings
  - Process check-ins
  - Process check-outs
  - Search reservations

- **View Travel Bookings** (`/Receptionist/ViewTravelBookings`)
  - View all travel bookings
  - Filter by status
  - View customer details
  - Check travel dates

- **Check-in/Check-out** (`/Receptionist/CheckInCheckOut`)
  - Process guest arrivals
  - Handle departures
  - Manage room keys
  - Update room status

- **Customer Requests** (`/Receptionist/CustomerRequests`)
  - View customer feedback/complaints
  - Forward to manager
  - Track request status

- **Profile** (`/Receptionist/Profile`)
  - Update personal information
  - Change password

### 4. Customer
**Public-facing booking and account management**

**Pages & Features:**
- **Home** (`/Customer/Home`)
  - Hero section with room search
  - Featured rooms carousel (with pagination)
  - Top attractions section
  - Local experiences showcase
  - Feedback form (in CTA section)
  - Room search functionality:
    - Check-in/Check-out dates
    - Number of guests
    - Room type selection (from database)
    - Redirects to Rooms page with filters

- **Rooms** (`/Customer/Rooms`)
  - Browse available rooms
  - Auto-sliding hero background images
  - Filter rooms by:
    - Room type
    - Number of guests
    - Check-in/Check-out dates
  - Room grid (3 cards per row on desktop)
  - Pagination controls
  - Room cards with images and pricing

- **Room Details** (`/Customer/RoomDetails`)
  - View room information
  - Image gallery
  - Amenities list
  - Pricing breakdown
  - Book now button

- **Explore** (`/Customer/Explore`)
  - Top attractions showcase
  - Attraction types:
    - Nature (RWF 180,000 per person)
    - Adventure (RWF 96,000 per person)
    - Wildlife (RWF 144,000 per person)
    - Culture (RWF 60,000 per person)
  - "Book Now" buttons on each attraction
  - Real forest images

- **Booking** (`/Customer/Booking`)
  - **Room Booking**:
    - Select dates
    - Number of guests
    - Guest information
    - Payment method (Card/MTN MoMo)
    - Cost breakdown (room price, taxes, concierge fee)
    - Total calculation in RWF
  
  - **Travel Booking**:
    - Attraction name and type
    - Travel date
    - Number of participants
    - Payment method
    - Price calculation (base price × participants)
    - Total in RWF

- **My Bookings** (`/Customer/MyBookings`)
  - **Room Bookings**:
    - View all room reservations
    - Booking status
    - Payment status
    - Booking details
  
  - **Travel Bookings**:
    - View all travel bookings
    - Attraction details
    - Travel date
    - Number of participants
    - Price paid
    - Refund status
    - "Request Refund" button (if eligible)

- **Profile** (`/Customer/Profile`)
  - View personal information
  - Update profile
  - Change password
  - Account settings

- **Support** (`/Customer/Support`)
  - Submit support requests
  - Select category
  - Send messages to support team
  - View support history

## 🚀 Installation & Setup

### Prerequisites
- .NET 8.0 SDK or later
- SQL Server 2019 or later
- Visual Studio 2022 or VS Code
- Windows/Linux/macOS

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd HRS-SmartBooking
```

### Step 2: Configure Database Connection
Update `appsettings.json` with your SQL Server connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=YOUR_SERVER;Initial Catalog=HotelReservationDB;Integrated Security=True;Trust Server Certificate=True"
  }
}
```

### Step 3: Install Dependencies
```bash
dotnet restore
```

### Step 4: Create Database
Run the SQL scripts in the `Database/` folder to create all tables, or use Entity Framework migrations:

```bash
dotnet ef database update
```

Or run the application and the database will be created automatically on first run.

### Step 5: Run the Application
```bash
dotnet run
```

Navigate to `https://localhost:5001` or `http://localhost:5000`

### Step 6: Initial Setup
1. Register the first admin user through the registration page
2. Login as admin and configure system settings (currency: RWF)
3. Add room types and rooms
4. Configure staff accounts (Manager, Receptionist)
5. Add travel attractions (optional, can be created via Manager portal)

## 💾 Database Configuration

### Database Schema
The system uses the following main tables:

- **Users**: User accounts and authentication
- **Rooms**: Room inventory with images
- **RoomTypes**: Room categories and configurations
- **Bookings**: Room reservation records
- **TravelBookings**: Travel/attraction booking records
- **Payments**: Payment transactions for room bookings
- **CheckInCheckOuts**: Guest check-in/out records
- **Reviews**: Customer reviews with ratings
- **Complaints**: Customer complaints and feedback
- **AuditLogs**: System activity logs
- **SystemSettings**: System configuration (currency, etc.)

### Travel Bookings Table
The `TravelBookings` table includes:
- `travel_booking_id`: Primary key
- `customer_id`: Foreign key to Users
- `attraction_name`: Name of the attraction
- `attraction_type`: Type (Nature, Adventure, Wildlife, Culture)
- `travel_date`: Date of travel
- `number_of_participants`: Number of people
- `total_price`: Total price in RWF
- `booking_status`: pending, confirmed, cancelled
- `payment_status`: pending, paid, refunded
- `payment_method`: Card or MTN MoMo
- `refund_requested`: Boolean flag
- `refund_requested_at`: Timestamp
- `refund_approved`: Boolean (nullable)
- `refund_approved_at`: Timestamp
- `refund_processed_at`: Timestamp
- `special_requests`: Text field
- `created_at`, `updated_at`, `cancelled_at`: Timestamps

## 🔑 Core Features

### Room Management
- **Add/Edit Rooms**: Full room information with images
- **Room Types**: Categorize rooms with amenities
- **Image Gallery**: Upload multiple images per room (up to 10)
- **Auto-sliding Backgrounds**: Room cards with carousel images
- **Pricing**: Set and update room prices in RWF
- **Availability**: Real-time availability tracking
- **Search & Filter**: Advanced filtering by type, guests, dates

### Booking System
- **Date Selection**: Check-in/Check-out date picker
- **Guest Information**: Customer details collection
- **Payment Integration**: Card and MTN MoMo support
- **Booking Status**: Pending, Confirmed, Cancelled states
- **Availability Checking**: Real-time conflict detection
- **Cost Calculation**: Automatic calculation of room price, taxes, and fees

### Payment Processing
- **Payment Methods**:
  - Credit/Debit Card
  - MTN Mobile Money
- **Payment Status**: Pending, Completed, Failed, Refunded
- **Transaction Tracking**: Complete payment history
- **Currency Support**: RWF (base) with USD display option
- **Payment Export**: CSV and PDF export for all payments

### Currency Management
- **Base Currency**: RWF (Rwandan Franc)
  - All prices are **stored** in RWF
  - All calculations are **performed** in RWF
  - All prices are **displayed** in RWF by default
- **Display Currency**: Optional USD conversion for display only
- **Exchange Rate**: 1 USD = 1200 RWF (for display conversion only)
- **Price Storage**: 
  - Room prices: RWF
  - Booking totals: RWF
  - Travel booking prices: RWF
- **Configuration**: Currency display preference in System Configuration

### Image Management
- **Upload**: Drag-and-drop or click to upload
- **Storage**: Images stored in `wwwroot/uploads/rooms/`
- **Multiple Images**: Support for up to 10 images per room
- **Database Storage**: Image URLs stored in comma-separated format
- **Auto-sliding**: Background images in room sections with carousel

### Search Functionality
- **Home Page Search**:
  - Check-in/Check-out dates
  - Number of guests
  - Room type (dynamically loaded from database)
  - Redirects to Rooms page with filters applied
  
- **Rooms Page Filtering**:
  - Room type filter
  - Guest capacity filter
  - Date range filtering
  - Real-time results update

## 🗺 Travel Booking System

### Overview
The travel booking system allows customers to book attractions and experiences offered by the hotel. Managers can create, edit, and manage travel bookings, and customers can request refunds.

### Attraction Types & Pricing
- **Nature**: RWF 180,000 per person
- **Adventure**: RWF 96,000 per person
- **Wildlife**: RWF 144,000 per person
- **Culture**: RWF 60,000 per person

### Booking Flow
1. **Customer** browses attractions on Explore page
2. Clicks "Book Now" on an attraction
3. Fills out travel booking form:
   - Attraction name (pre-filled)
   - Attraction type (pre-filled)
   - Travel date
   - Number of participants
   - Payment method
4. System calculates total: `base_price × participants`
5. Booking is created with status "pending"
6. Payment is processed
7. Booking status changes to "confirmed"

### Refund Workflow
1. **Customer** views travel booking in "My Bookings"
2. Clicks "Request Refund" button (if eligible)
3. Refund request is submitted (`refund_requested = true`)
4. **Manager** views refund request in "Manage Travel Bookings"
5. Manager approves or denies refund
6. If approved, refund is processed
7. Payment status changes to "refunded"

### Manager Functions
- **Create Travel Booking**: Create bookings for customers
- **Edit Travel Booking**: Modify existing bookings
- **Delete Travel Booking**: Remove bookings
- **Approve Refunds**: Approve or deny refund requests
- **Filter & Search**: Filter by status, payment, refund status
- **View All**: See all travel bookings with customer details

### Travel Booking Status
- **Booking Status**: pending, confirmed, cancelled
- **Payment Status**: pending, paid, refunded
- **Refund Status**: N/A, Pending, Approved, Denied, Processed

## 💬 Feedback & Support System

### Customer Feedback
Customers can submit feedback through:
1. **Home Page CTA Section**: Feedback form on the right side
2. **Support Page**: Detailed support request form
3. **Reviews**: Rate and review room bookings

### Feedback Types
- **Reviews**: Rating (1-5 stars) + comment for room bookings
- **Complaints/Feedback**: General feedback, suggestions, support requests
  - Subject
  - Category
  - Description
  - Status: open, pending, resolved

### Feedback Workflow
1. **Customer** submits feedback via form
2. Feedback is stored in `Complaints` table
3. **Receptionist** can view feedback in "Customer Requests"
4. Receptionist forwards important feedback to Manager
5. **Manager** views all feedback in "Customer Feedback" page
6. Manager can respond and update status
7. Feedback status: open → pending → resolved

### Manager Feedback Management
- View all reviews (with star ratings)
- View all complaints/feedback
- Filter by type (review vs. complaint)
- Track feedback status
- Respond to customers

## 🔌 API & Services

### Services

#### AuthService
- User authentication
- Password hashing (BCrypt)
- Session management
- User ID retrieval

#### BookingService
- Booking creation and management
- Availability checking
- Date conflict resolution
- Room booking validation

#### RoomService
- Room CRUD operations
- Availability queries
- Room type management
- Image handling

#### CurrencyHelper
- Currency conversion (for display)
- Price formatting (RWF/USD)
- Currency preference management
- RWF as base currency

#### ReportExportService
- CSV export generation
- PDF/HTML report generation
- Excel export (CSV format)
- Payment reports (rooms + travel)
- Financial reports

#### DashboardService
- Statistics calculation
- Chart data generation
- Revenue analytics (rooms + travel)
- Booking statistics
- Monthly revenue charts

#### UserService
- User management
- Profile updates
- Role management
- Account activation

## 📊 Report Export

### Available Export Formats

#### CSV Export
- Payments report (rooms + travel)
- Financial reports
- Transaction history
- Booking data

#### PDF Export
- HTML-based PDF reports
- Payment summaries
- Financial statements
- Printable reports

#### Excel Export
- CSV format (compatible with Excel)
- Financial data
- Revenue reports
- Booking analytics

### Export Locations

1. **Admin Payments Page** (`/Admin/Payments`)
   - Export CSV: Downloads all payment transactions (rooms + travel) as CSV
   - Export PDF: Downloads payment report as HTML (printable as PDF)
   - Includes "Type" column (Room Booking / Travel Booking)

2. **Manager Financial Reports** (`/Manager/FinancialReports`)
   - Export PDF: Downloads financial report
   - Export Excel: Downloads financial data as CSV
   - Print: Opens browser print dialog
   - Includes revenue from both rooms and travel

### How to Use Export Features

1. Navigate to the reports page
2. Apply any filters if needed
3. Click the export button (CSV, PDF, or Excel)
4. File will download automatically
5. Open in appropriate application (Excel, PDF viewer, etc.)

## 💳 Payment Methods

### Card Payment
- Card number input
- Expiry date
- CVC code
- Secure processing
- Transaction ID generation

### MTN Mobile Money
- Phone number input
- Transaction ID tracking
- Mobile money integration ready
- Payment confirmation

### Payment Status
- **Pending**: Payment initiated but not completed
- **Completed/Paid**: Payment successfully processed
- **Failed**: Payment processing failed
- **Refunded**: Payment has been refunded

## 💱 Currency Support

### Setting Currency
1. Login as Admin
2. Navigate to System Configuration
3. Select currency (RWF or USD for display)
4. Click "Save settings"

### Currency System
- **Storage Currency**: RWF (Rwandan Franc)
  - All prices are **stored** in RWF in the database
- **Calculation Currency**: RWF
  - All price calculations are **performed** in RWF
- **Display Currency**: RWF (default) or USD (optional)
  - RWF: Direct display
  - USD: Converted for display only (1 USD = 1200 RWF)
- **Important Notes**:
  - When creating or editing rooms, enter prices in RWF
  - All booking totals are calculated and stored in RWF
  - Travel booking prices are in RWF
  - Dashboard revenue shows RWF totals

## 📁 File Structure

```
HRS-SmartBooking/
├── Attributes/
│   └── AuthorizeRoleAttribute.cs    # Role-based authorization
├── Data/
│   ├── ApplicationDbContext.cs      # EF Core context
│   └── DatabaseSeeder.cs            # Database seeding
├── Database/
│   └── CreateTravelBookingsTable.sql # Travel bookings table script
├── Helpers/
│   └── TranslationHelper.cs         # Multi-language support
├── Models/
│   ├── User.cs                      # User entity
│   ├── Room.cs                      # Room entity
│   ├── RoomType.cs                  # Room type entity
│   ├── Booking.cs                   # Booking entity
│   ├── Payment.cs                   # Payment entity
│   ├── TravelBooking.cs             # Travel booking entity
│   ├── Review.cs                    # Review entity
│   ├── Complaint.cs                 # Complaint entity
│   ├── CheckInCheckOut.cs           # Check-in/out entity
│   ├── AuditLog.cs                  # Audit log entity
│   └── SystemSettings.cs            # System settings entity
├── Pages/
│   ├── Admin/                       # Admin pages
│   │   ├── Dashboard.cshtml
│   │   ├── UserManagement.cshtml
│   │   ├── RolesPermissions.cshtml
│   │   ├── StaffManagement.cshtml
│   │   ├── SystemConfiguration.cshtml
│   │   ├── AuditLogs.cshtml
│   │   ├── Payments.cshtml
│   │   ├── Reports.cshtml
│   │   ├── DatabaseControl.cshtml
│   │   ├── BackupRestore.cshtml
│   │   ├── SecurityCenter.cshtml
│   │   └── Profile.cshtml
│   ├── Manager/                      # Manager pages
│   │   ├── Dashboard.cshtml
│   │   ├── ManageBookings.cshtml
│   │   ├── ManageTravelBookings.cshtml
│   │   ├── CreateTravelBooking.cshtml
│   │   ├── ManageRooms.cshtml
│   │   ├── AddRoom.cshtml
│   │   ├── ManageAmenities.cshtml
│   │   ├── RoomTypes.cshtml
│   │   ├── StaffManagement.cshtml
│   │   ├── FinancialReports.cshtml
│   │   ├── CustomerFeedback.cshtml
│   │   └── Profile.cshtml
│   ├── Receptionist/                # Receptionist pages
│   │   ├── Dashboard.cshtml
│   │   ├── ManageReservations.cshtml
│   │   ├── ViewTravelBookings.cshtml
│   │   ├── CheckInCheckOut.cshtml
│   │   ├── CustomerRequests.cshtml
│   │   └── Profile.cshtml
│   ├── Customer/                     # Customer pages
│   │   ├── Home.cshtml
│   │   ├── Rooms.cshtml
│   │   ├── RoomDetails.cshtml
│   │   ├── Explore.cshtml
│   │   ├── Booking.cshtml
│   │   ├── MyBookings.cshtml
│   │   ├── Profile.cshtml
│   │   └── Support.cshtml
│   ├── Feedback/
│   │   └── Submit.cshtml
│   └── Shared/                       # Shared layouts
│       ├── _Layout.cshtml
│       ├── _CustomerLayout.cshtml
│       ├── _PortalLayout.cshtml
│       └── _AdminLayout.cshtml
├── Services/
│   ├── AuthService.cs               # Authentication
│   ├── BookingService.cs            # Booking logic
│   ├── RoomService.cs                # Room management
│   ├── UserService.cs                # User management
│   ├── DashboardService.cs          # Dashboard data
│   ├── CurrencyHelper.cs            # Currency operations
│   └── ReportExportService.cs        # Report generation
├── wwwroot/
│   ├── css/                          # Stylesheets
│   │   ├── site.css
│   │   └── customer.css
│   ├── js/                           # JavaScript files
│   ├── lib/                          # Third-party libraries
│   ├── images/                       # Static images
│   │   └── forest*.jpg              # Travel attraction images
│   └── uploads/                      # Uploaded files
│       └── rooms/                    # Room images
├── appsettings.json                  # Configuration
└── Program.cs                        # Application entry point
```

## ⚙️ Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your connection string here"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Session Configuration
- Timeout: 30 minutes
- HttpOnly: Enabled
- Essential: Enabled
- Cookie-based session storage

## 📖 Usage Guide

### For Administrators

1. **System Setup**
   - Configure currency (RWF/USD display)
   - Set up payment methods
   - Configure system settings
   - Set up database backups

2. **User Management**
   - Create user accounts for all roles
   - Assign roles (Admin, Manager, Receptionist, Customer)
   - Manage permissions
   - Activate/deactivate users

3. **Monitoring**
   - View audit logs for all system activities
   - Monitor payments (rooms + travel)
   - Generate comprehensive reports
   - Track system performance

4. **Database Management**
   - Create backups
   - Restore from backups
   - Monitor database health
   - Execute queries

### For Managers

1. **Room Management**
   - Add/edit rooms with images
   - Upload multiple room images
   - Set pricing in RWF
   - Manage room types and amenities
   - Update availability

2. **Travel Management**
   - Create travel bookings for customers
   - Edit existing travel bookings
   - Delete travel bookings
   - Approve refund requests
   - Set travel attraction prices

3. **Booking Management**
   - View all room reservations
   - Filter and search bookings
   - Approve pending bookings
   - Manage booking status

4. **Financial Reports**
   - View revenue charts (rooms + travel)
   - Export reports (PDF, Excel)
   - Analyze payment methods
   - Track monthly revenue

5. **Customer Feedback**
   - View customer reviews (with ratings)
   - View complaints and feedback
   - Respond to customers
   - Track feedback status

6. **Staff Management**
   - Manage receptionist accounts
   - View staff assignments
   - Track performance

### For Receptionists

1. **Check-in/Check-out**
   - Process guest arrivals
   - Handle departures
   - Manage room keys
   - Update room status

2. **Booking Management**
   - View room reservations
   - Filter by room type, status, date
   - Approve pending bookings
   - Process payments

3. **Travel Bookings**
   - View all travel bookings
   - Check travel dates
   - View customer details

4. **Customer Requests**
   - View customer feedback/complaints
   - Forward to manager
   - Track request status

### For Customers

1. **Browse Rooms**
   - Use home page search (dates, guests, room type)
   - View available rooms on Rooms page
   - See room details and images
   - Check pricing in RWF

2. **Book Rooms**
   - Select check-in/check-out dates
   - Choose number of guests
   - Enter guest information
   - Select payment method (Card/MTN MoMo)
   - Complete reservation

3. **Book Travel**
   - Browse attractions on Explore page
   - Click "Book Now" on an attraction
   - Select travel date and participants
   - Choose payment method
   - Complete travel booking

4. **Manage Bookings**
   - View all room bookings
   - View all travel bookings
   - Check booking status
   - Request refunds for travel bookings

5. **Submit Feedback**
   - Submit feedback via home page form
   - Submit support requests
   - Leave reviews for room bookings
   - Track feedback status

6. **Manage Account**
   - View booking history
   - Update profile
   - Change password
   - View account settings

## 🔄 Workflows

### Room Booking Workflow
1. Customer searches for rooms (home page or Rooms page)
2. Customer views room details
3. Customer clicks "Book Now"
4. Customer fills booking form (dates, guests, payment)
5. System checks availability
6. Booking created with status "pending"
7. Payment processed
8. Receptionist/Manager approves booking
9. Booking status changes to "confirmed"
10. Customer receives confirmation
11. Check-in processed by Receptionist
12. Check-out processed by Receptionist

### Travel Booking Workflow
1. Customer browses attractions on Explore page
2. Customer clicks "Book Now" on an attraction
3. Customer fills travel booking form (date, participants, payment)
4. System calculates total price (base price × participants)
5. Travel booking created with status "pending"
6. Payment processed
7. Booking status changes to "confirmed"
8. Customer receives confirmation

### Refund Workflow (Travel Bookings)
1. Customer views travel booking in "My Bookings"
2. Customer clicks "Request Refund" (if eligible)
3. Refund request submitted (`refund_requested = true`)
4. Manager views refund request in "Manage Travel Bookings"
5. Manager reviews request
6. Manager approves or denies refund
7. If approved: refund processed, payment status = "refunded"
8. Customer notified of refund status

### Feedback Workflow
1. Customer submits feedback (home page form or Support page)
2. Feedback stored in `Complaints` table
3. Receptionist views feedback in "Customer Requests"
4. Receptionist forwards important feedback to Manager
5. Manager views all feedback in "Customer Feedback"
6. Manager responds and updates status
7. Feedback status: open → pending → resolved

### Payment Workflow
1. Customer selects payment method (Card/MTN MoMo)
2. Payment details entered
3. Payment processed
4. Payment record created with status "pending"
5. Payment status changes to "completed"/"paid"
6. Booking confirmed
7. Payment appears in Admin/Manager payment reports

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Error
- Verify SQL Server is running
- Check connection string in appsettings.json
- Ensure database exists or can be created
- Check SQL Server authentication settings

#### Image Upload Not Working
- Check `wwwroot/uploads/rooms/` folder exists
- Verify write permissions on uploads folder
- Check file size limits (10MB default)
- Ensure file extensions are allowed (.jpg, .jpeg, .png)

#### Payment Export Not Working
- Ensure ReportExportService is registered in Program.cs
- Check browser download settings
- Verify user has export permissions
- Check file path permissions

#### Currency Not Displaying Correctly
- Check SystemSettings table for currency setting
- Verify CurrencyHelper is registered
- Clear browser cache
- Ensure all prices are stored in RWF

#### Travel Booking Not Showing
- Verify TravelBookings table exists
- Check database migration status
- Verify TravelBooking model is in ApplicationDbContext
- Check user has proper role permissions

#### Search Not Working
- Verify RoomTypes are populated in database
- Check JavaScript console for errors
- Ensure form method is "post" with handler
- Verify route parameters are correct

#### Refund Button Not Appearing
- Check booking status (must be confirmed)
- Verify payment status (must be paid)
- Check refund_requested flag (must be false)
- Ensure user is the booking owner

### Debug Mode
Enable detailed error messages in `appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

## 🔒 Security Features

- **Password Security**: BCrypt hashing with show/hide password toggle
- **Session-based Authentication**: Secure session management
- **Role-based Access Control**: Granular permissions per role
- **SQL Injection Prevention**: Entity Framework Core parameterized queries
- **XSS Protection**: Input sanitization and encoding
- **CSRF Protection**: Anti-forgery tokens on forms
- **Audit Logging**: Complete system activity tracking
- **Secure File Uploads**: File type and size validation
- **Session Timeout**: 30-minute inactivity timeout

## 📝 Development Notes

### Adding New Features
1. Create model in `Models/` folder
2. Add DbSet to ApplicationDbContext
3. Create database migration or SQL script
4. Create service in `Services/` folder
5. Register service in Program.cs
6. Create Razor Page in appropriate folder
7. Add navigation link if needed
8. Update README documentation

### Database Migrations
```bash
# Create migration
dotnet ef migrations add MigrationName

# Apply migration
dotnet ef database update

# Or use SQL scripts in Database/ folder
```

### Adding New Travel Attractions
1. Manager logs in
2. Navigate to "Create Travel Booking"
3. Create a booking with attraction details
4. Or update Explore page to add new attractions

### Customizing Prices
- Room prices: Edit in "Manage Rooms" or "Add Room"
- Travel prices: Set in `Booking.cshtml.cs` (base prices) or via Manager portal
- All prices must be in RWF

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support and inquiries, please contact the development team.

## 🎉 Acknowledgments

- Built with ASP.NET Core 8.0
- Bootstrap 5 for UI components
- Entity Framework Core for data access
- BCrypt for password security
- Bootstrap Icons for iconography

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**Framework**: .NET 8.0  
**Base Currency**: RWF (Rwandan Franc)
