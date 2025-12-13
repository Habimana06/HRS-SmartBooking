# HRS Smart Booking API

A comprehensive Hotel Reservation System REST API built with ASP.NET Core 8.0 Web API, featuring role-based access control, multi-currency support, payment processing, travel booking management, and comprehensive reporting capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [API Architecture](#api-architecture)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Installation & Setup](#installation--setup)
- [Database Configuration](#database-configuration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Currency Support](#currency-support)
- [Payment Processing](#payment-processing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

HRS Smart Booking API is a RESTful backend service designed to power hotel and travel management applications. The API supports multiple user roles, real-time booking management for both rooms and travel attractions, payment processing, refund management, customer feedback, and comprehensive reporting.

**Frontend**: React application (separate repository)  
**Backend**: ASP.NET Core 8.0 Web API (this repository)

The API handles:
- **Room Reservations**: Complete room booking lifecycle from search to check-out
- **Travel Bookings**: Attraction and experience bookings with refund capabilities
- **Payment Processing**: Multiple payment methods with transaction tracking
- **Customer Feedback**: Reviews, complaints, and support requests
- **Financial Management**: Revenue tracking, reports, and analytics
- **User Management**: Role-based JWT authentication for Admin, Manager, Receptionist, and Customer

## ✨ Features

### Core API Features
- **RESTful API**: JSON-based REST API with CORS support
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Admin, Manager, Receptionist, and Customer roles
- **Swagger/OpenAPI**: Interactive API documentation
- **Room Management**: Complete CRUD operations for rooms and room types
- **Travel Booking System**: Book attractions and experiences with refund workflow
- **Payment Processing**: Support for Card and MTN Mobile Money payments
- **Multi-Currency**: PostgreSQL-based storage with RWF as base currency
- **File Uploads**: Room image upload and management
- **Email Verification**: Email-based account verification
- **Session Management**: Stateless API with session support
- **Audit Logging**: Complete system activity tracking
- **Report Generation**: Export reports in CSV, PDF, and Excel formats
- **CORS**: Configured for React frontend integration

## 🛠 Technology Stack

- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: PostgreSQL 15+ with Entity Framework Core 8.0
- **Authentication**: JWT Bearer Tokens + Session (for compatibility)
- **Password Hashing**: BCrypt
- **ORM**: Entity Framework Core with Npgsql
- **API Documentation**: Swagger/Swashbuckle
- **Email**: SMTP Email Service
- **Architecture**: Clean Architecture with Service Layer
- **Deployment**: Railway (recommended) or any cloud platform

## 🏗 API Architecture

```
HRSAPI/
├── Controllers/              # API Controllers
│   ├── AdminController.cs   # Admin endpoints
│   ├── AuthController.cs    # Authentication endpoints
│   ├── CustomerController.cs # Customer endpoints
│   ├── ManagerController.cs # Manager endpoints
│   ├── ReceptionistController.cs # Receptionist endpoints
│   ├── RoomsController.cs   # Room management
│   └── MessagesController.cs # Chat/messaging
├── Database/                 # SQL scripts
├── wwwroot/                  # Static files & uploads
│   └── uploads/rooms/       # Room images
├── Program.cs               # API configuration
├── appsettings.json         # Configuration
└── Dockerfile               # Docker configuration

HRS-SmartBooking/ (shared library)
├── Models/                  # Entity models
│   ├── User.cs
│   ├── Room.cs
│   ├── Booking.cs
│   ├── TravelBooking.cs
│   └── ...
├── Services/                # Business logic
│   ├── AuthService.cs
│   ├── BookingService.cs
│   ├── RoomService.cs
│   ├── EmailVerificationService.cs
│   └── ...
├── Data/                    # Database context
│   ├── ApplicationDbContext.cs
│   └── ApplicationDbContextFactory.cs
└── Helpers/                 # Utilities
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout          - Logout user
POST   /api/auth/verify-email    - Verify email with code
GET    /api/auth/session         - Get current session
```

### Rooms
```
GET    /api/rooms                - Get all rooms
GET    /api/rooms/{id}           - Get room by ID
GET    /api/rooms/search         - Search rooms (with filters)
POST   /api/rooms                - Create room (Manager/Admin)
PUT    /api/rooms/{id}           - Update room (Manager/Admin)
DELETE /api/rooms/{id}           - Delete room (Admin)
POST   /api/rooms/{id}/images    - Upload room images
```

### Bookings
```
GET    /api/bookings             - Get all bookings
GET    /api/bookings/{id}        - Get booking by ID
GET    /api/bookings/my          - Get current user's bookings
POST   /api/bookings             - Create booking
PUT    /api/bookings/{id}        - Update booking
DELETE /api/bookings/{id}        - Cancel booking
POST   /api/bookings/{id}/checkin - Check-in
POST   /api/bookings/{id}/checkout - Check-out
```

### Travel Bookings
```
GET    /api/travel               - Get all travel bookings
GET    /api/travel/{id}          - Get travel booking by ID
GET    /api/travel/my            - Get current user's travel bookings
POST   /api/travel               - Create travel booking
PUT    /api/travel/{id}          - Update travel booking
DELETE /api/travel/{id}          - Delete travel booking
POST   /api/travel/{id}/refund   - Request refund
PUT    /api/travel/{id}/approve-refund - Approve refund (Manager)
```

### Payments
```
GET    /api/payments             - Get all payments (Admin/Manager)
GET    /api/payments/{id}        - Get payment by ID
POST   /api/payments             - Process payment
GET    /api/payments/export/csv  - Export payments as CSV
GET    /api/payments/export/pdf  - Export payments as PDF
```

### Admin
```
GET    /api/admin/users          - Get all users
POST   /api/admin/users          - Create user
PUT    /api/admin/users/{id}     - Update user
DELETE /api/admin/users/{id}     - Delete user
GET    /api/admin/dashboard      - Dashboard statistics
GET    /api/admin/audit-logs     - View audit logs
```

### Manager
```
GET    /api/manager/dashboard    - Manager dashboard
GET    /api/manager/bookings     - Manage bookings
GET    /api/manager/travel       - Manage travel bookings
GET    /api/manager/reports      - Financial reports
GET    /api/manager/feedback     - Customer feedback
```

### Customer
```
GET    /api/customer/profile     - Get profile
PUT    /api/customer/profile     - Update profile
GET    /api/customer/bookings    - Get my bookings
POST   /api/customer/feedback    - Submit feedback
POST   /api/customer/review      - Submit review
```

## 🔐 Authentication & Authorization

### JWT Authentication
The API uses JWT Bearer tokens for authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Login Flow
1. Client sends `POST /api/auth/login` with credentials
2. API validates credentials
3. API returns JWT token + user info
4. Client stores token (localStorage/sessionStorage)
5. Client includes token in all subsequent requests

### Role-Based Authorization
- **Admin**: Full system access
- **Manager**: Operational control and management
- **Receptionist**: Front desk operations
- **Customer**: Public-facing booking and account management

### Session Support
The API also supports session-based authentication for backwards compatibility.

## 🚀 Installation & Setup

### Prerequisites
- .NET 8.0 SDK or later
- PostgreSQL 15 or later
- Visual Studio 2022 or VS Code
- Node.js 18+ (for React frontend)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd HRSAPI
```

### Step 2: Configure Database Connection
Update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=Hrs_bookingDB;Username=postgres;Password=yourpassword"
  }
}
```

### Step 3: Install Dependencies
```bash
dotnet restore
```

### Step 4: Run Migrations
Migrations run automatically on startup, or manually:
```bash
cd ../HRS-SmartBooking
dotnet ef database update --startup-project ../HRSAPI
```

### Step 5: Run the API
```bash
cd HRSAPI
dotnet run
```

API will be available at:
- HTTPS: `https://localhost:7001`
- HTTP: `http://localhost:5000`
- Swagger: `https://localhost:7001/swagger`

### Step 6: Test the API
Visit `https://localhost:7001/swagger` to test endpoints interactively.

## 💾 Database Configuration

### PostgreSQL Setup
1. Install PostgreSQL 15+
2. Create database: `Hrs_bookingDB`
3. Update connection string in `appsettings.json`
4. Run the application (migrations run automatically)

### Database Schema
The system uses the following main tables:

- **Users**: User accounts and authentication
- **Rooms**: Room inventory with images
- **RoomTypes**: Room categories and configurations
- **Bookings**: Room reservation records
- **TravelBookings**: Travel/attraction booking records
- **Payments**: Payment transactions
- **CheckInCheckOuts**: Guest check-in/out records
- **Reviews**: Customer reviews with ratings
- **Complaints**: Customer complaints and feedback
- **EmailVerificationCodes**: Email verification codes
- **AuditLogs**: System activity logs
- **SystemSettings**: System configuration

### Migration Commands
```bash
# Create new migration
dotnet ef migrations add MigrationName --project HRS-SmartBooking --startup-project HRSAPI

# Apply migrations
dotnet ef database update --startup-project HRSAPI

# Remove last migration
dotnet ef migrations remove --project HRS-SmartBooking --startup-project HRSAPI
```

## 🚢 Deployment

### Deploy to Railway (Recommended)

#### Step 1: Create Dockerfile
Already included in the repository.

#### Step 2: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 3: Deploy on Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add PostgreSQL database:
   - Click "+ New" → "Database" → "PostgreSQL"
5. Railway auto-detects Dockerfile and deploys
6. Get your API URL from Railway dashboard

#### Step 4: Set Environment Variables
Railway automatically sets:
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

Add custom variables if needed:
- `ASPNETCORE_ENVIRONMENT` = `Production`
- `Smtp__Host` = Your SMTP host
- `Smtp__Port` = SMTP port
- `Smtp__Username` = SMTP username
- `Smtp__Password` = SMTP password

### Deploy to Other Platforms
The API can also be deployed to:
- **Azure App Service**: Use Azure SQL or PostgreSQL
- **AWS Elastic Beanstalk**: Deploy with RDS PostgreSQL
- **Heroku**: Add PostgreSQL addon
- **Docker**: Use included Dockerfile

## 📚 API Documentation

### Swagger/OpenAPI
Interactive API documentation available at:
- Development: `https://localhost:7001/swagger`
- Production: `https://your-api.railway.app/swagger`

### Authentication in Swagger
1. Click "Authorize" button
2. Enter: `Bearer <your-jwt-token>`
3. Click "Authorize"
4. Test endpoints

### Response Format
All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

## 💱 Currency Support

### Base Currency: RWF (Rwandan Franc)
- All prices are **stored** in RWF
- All calculations are **performed** in RWF
- All API responses return prices in RWF

### Display Currency
The React frontend can convert RWF to USD for display:
- Exchange rate: 1 USD = 1200 RWF (approximate)

### Price Examples
```json
{
  "roomPrice": 180000,        // RWF 180,000
  "totalPrice": 216000,       // RWF 216,000
  "currency": "RWF"
}
```

## 💳 Payment Processing

### Supported Payment Methods
- **Card**: Credit/Debit card processing
- **MTN Mobile Money**: MTN MoMo integration

### Payment Flow
1. Client creates booking (status: pending)
2. Client sends payment details to `/api/payments`
3. API processes payment
4. Payment status updated
5. Booking confirmed

### Payment Status
- `pending` - Payment initiated
- `paid` / `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
Update `Program.cs` to include your frontend URL:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("https://your-frontend.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

#### Database Connection Fails
- Check PostgreSQL is running
- Verify connection string
- Check firewall settings
- Test connection with `psql`

#### Migrations Not Running
- Ensure `ApplicationDbContextFactory.cs` exists
- Check connection string in factory
- Run migrations manually

#### Image Upload Fails
- Check `wwwroot/uploads/rooms/` folder exists
- Verify write permissions
- Check file size limits (10MB default)

#### Railway Deployment Fails
- Check Dockerfile syntax
- Verify `ASPNETCORE_URLS=http://+:8080`
- Check Railway logs for errors
- Ensure PostgreSQL service is added

### Enable Debug Logging
Update `appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: BCrypt with salt
- **CORS**: Configured for React frontend
- **HTTPS**: SSL/TLS encryption
- **SQL Injection Prevention**: EF Core parameterized queries
- **XSS Protection**: Input validation
- **Rate Limiting**: Request throttling (configure as needed)
- **Audit Logging**: Complete activity tracking

## 🧪 Testing

### Test with Swagger
1. Navigate to `/swagger`
2. Test endpoints interactively
3. View request/response schemas

### Test with Postman
1. Import Swagger JSON
2. Set up environment variables
3. Test all endpoints

### Test with cURL
```bash
# Login
curl -X POST https://your-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get rooms (with auth)
curl https://your-api.railway.app/api/rooms \
  -H "Authorization: Bearer <your-token>"
```

## 📄 Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=Hrs_bookingDB;Username=postgres;Password=yourpassword"
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "noreply@hrsbooking.com",
    "FromName": "HRS Booking"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Environment Variables (Railway)
```
DATABASE_URL=postgresql://user:pass@host:port/db
ASPNETCORE_ENVIRONMENT=Production
Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__Username=your-email@gmail.com
Smtp__Password=your-app-password
```

## 🔄 API Versioning
Current version: **v1**

Future versions will be accessible via:
- `/api/v1/...` (current)
- `/api/v2/...` (future)

## 📝 Development Notes

### Adding New Endpoints
1. Create controller in `Controllers/`
2. Add methods with proper routing
3. Use `[Authorize(Roles = "...")]` for auth
4. Update Swagger documentation
5. Test with Swagger

### Database Changes
1. Modify models in `HRS-SmartBooking/Models/`
2. Update `ApplicationDbContext`
3. Create migration
4. Test locally
5. Push to production (migrations run automatically)

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support and inquiries, please contact the development team.

## 🎉 Acknowledgments

- Built with ASP.NET Core 8.0 Web API
- PostgreSQL for database
- Entity Framework Core for ORM
- BCrypt for password security
- Npgsql for PostgreSQL connectivity
- Swagger/Swashbuckle for API documentation

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Framework**: .NET 8.0 Web API  
**Database**: PostgreSQL 15+  
**Base Currency**: RWF (Rwandan Franc)  
**Authentication**: JWT Bearer Tokens
