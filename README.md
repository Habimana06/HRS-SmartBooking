📘 HRS Smart Booking System – Full-Stack (Updated Version)

A complete Hotel & Travel Reservation System built with:

Frontend: React.js + Tailwind CSS

Backend: ASP.NET Core Web API

Database: SQL Server

Authentication: Email Code Verification (OTP-based login & registration)

The system provides hotel room booking, travel attraction booking, payment processing, refund management, reporting, and multi-role dashboards.

🚀 Table of Contents

Overview

Key Features

Technology Stack

System Architecture

User Roles

Installation Guide

Run Backend (API)

Run Frontend (React)

Database Schema

Authentication (Email OTP)

Core Modules

Travel Booking System

Payment Processing

Currency Handling

Folder Structure

🎯 Overview

HRS Smart Booking is a modern full-stack reservation management platform designed for hotels, lodges, and travel businesses.
It provides separate backend and frontend applications connected via REST API.

✨ Key Features
🏨 Hotel Reservation

Room management

Room type & amenities

Image gallery (multi-upload)

Real-time availability

🌍 Travel Attraction Booking

Nature, Adventure, Wildlife, Culture attractions

Pricing per attraction

Refund management

🔑 Authentication (Email OTP)

Email code verification (login & signup)

10-minute expiry

Prevention of unauthorized access

Role-based routing in frontend

💳 Payments

MTN Mobile Money

Card payments

Payment status

Refund workflow

📊 Dashboard + Reports

Admin, Manager, Receptionist dashboards

Insight charts

Export: PDF, CSV, Excel

🛠 Technology Stack
Layer	Technology
Frontend	React.js, Tailwind CSS, Axios, React Router
Backend	ASP.NET Core Web API 8.0
Database	SQL Server
ORM	Entity Framework Core
Auth	Email OTP Verification
Security	JWT Authentication + BCrypt Hashing
Architecture	API + Client separated
🏗 System Architecture (Updated – Frontend + Backend)
HRS-SmartBooking/
│
├── backend/ (ASP.NET Core Web API)
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── Repositories/
│   ├── DTOs/
│   ├── Mappings/
│   ├── Emails/ (OTP Sending)
│   └── Program.cs
│
└── frontend/ (React + Tailwind)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── hooks/
    │   └── api/
    └── tailwind.config.js

📥 Installation Guide
🟦 1. Run Backend (ASP.NET Core API)
Step 1 — Navigate to backend folder:
cd backend

Step 2 — Restore dependencies:
dotnet restore

Step 3 — Update database:
dotnet ef database update

Step 4 — Run API:
dotnet run


API runs at:

http://localhost:5000

https://localhost:5001

🟩 2. Run Frontend (React + Tailwind)
Step 1 — Go to frontend folder:
cd frontend

Step 2 — Install dependencies:
npm install

Step 3 — Run React development server:
npm run dev


Frontend runs at:

👉 http://localhost:5173/

🔑 Authentication (Email OTP Verification)
Features:

OTP sent to email

6-digit verification code

Expires in 10 minutes

Required for:

Registration

Login

Forgot password

Built with SMTP email service

Backend Example Flow:
User enters email → System sends OTP → User enters OTP → System verifies → JWT Issued

🗄 Database Schema
Main Tables:

Users

Rooms

RoomTypes

TravelBookings

Payments

RefundRequests

Roles

Reviews

Complaints

CheckIns

EmailVerificationCodes (for OTP)

🌍 Travel Booking System
Attraction Pricing:
Type	Price per person (RWF)
Nature	180,000
Adventure	96,000
Wildlife	144,000
Culture	60,000
Refund Workflow:
Customer → Request Refund → Manager Approves → System Returns Money

💳 Payment Processing

MTN Mobile Money API

Card payments

Payment tracking

Invoice generation

Refund & reversal handling

💱 Currency Handling

Default: RWF

Optional display: USD

Rate used: 1 USD = 1200 RWF

📁 Folder Structure (Updated)
Backend
backend/
├── Controllers/
├── DTOs/
├── Models/
├── Services/
├── Repositories/
├── Migrations/
├── Emails/
└── appsettings.json

Frontend
frontend/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── hooks/
│   └── utils/
├── public/
└── tailwind.config.js
