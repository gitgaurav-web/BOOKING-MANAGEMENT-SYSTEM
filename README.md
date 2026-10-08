# Seminar Hall & AV Hall Booking Management System

A modern, responsive, ultra-fast full-stack web application designed for colleges, universities, and academic institutions to manage date-wise availability and whole-hall reservations for:

1. **Seminar Hall** (~200 capacity, tiered auditorium, podium, surround sound, full AC)
2. **AV Hall (Audio Visual Hall)** (~120 capacity, interactive smartboards, PTZ telepresence conferencing)

> [!IMPORTANT]
> **Whole Hall Date Availability (Zero Seat Reservation)**:
> This system strictly manages date-wise and time-slot facility reservations. There are **no seat maps**, **no seat numbers**, and **no seat selection**. Facility capacity is purely informational.

---

## 🌟 Key Features

- **Availability Engine**:
  - Month, Week, and List Calendar perspectives.
  - Strict color-coding:
    - 🟢 **AVAILABLE**: Facility is completely free for reservations.
    - 🔴 **BOOKED**: Facility has an approved whole-hall event.
    - 🟡 **PENDING**: Reservation request is under review.
    - ⚫ **BLOCKED / MAINTENANCE**: Facility unavailable due to exams, servicing, or holidays.
    - 🔵 **SELECTED DATE**: Interactive selection.
- **Strict Double-Booking Prevention**:
  - Evaluates conflicting approved reservations, blocked date intervals, maintenance downtime, and institutional holidays before approving or booking.
- **Role-Based Access Control (RBAC)**:
  - **Public / Student**: View hall details, live status today, check availability calendar.
  - **Faculty / Coordinator**: Submit booking requests, view My Bookings, download printable booking vouchers (`HB-2026-XXXX`).
  - **Admin**: Approve/reject pending requests, block dates, edit bookings, manage halls, view reports, export CSVs, track activity audit logs.
  - **Super Admin**: Assign and modify administrator roles and permissions.
- **Admin Management Suite**:
  - **Dashboard**: Metric cards and analytics charts (Bar charts for hall usage, Pie charts for booking distribution).
  - **Pending Requests Desk**: One-click approval with automatic calendar sync, or documented rejection with reason.
  - **Hall Management**: Edit hall details, descriptions, amenities, and location.
  - **Blocked Dates & Maintenance Modules**: Schedule blackout periods for examinations and acoustic servicing.
  - **Institutional Holidays**: Configure holidays that automatically block facilities.
  - **Reports & CSV Export**: One-click export of facility bookings and department utilization metrics.
  - **System Settings**: Configurable booking notice windows (e.g., min 1 day, max 90 days), institutional branding, and notification templates.
- **Modern UI & Speed**:
  - React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Recharts + canvas-confetti.
  - Full **Dark Mode & Light Mode** toggle with persistent storage.
  - Responsive mobile drawer navigation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm

### 1. Database Setup & Seeding (Backend)
```bash
cd server
npm install
npx prisma db push
npx tsx src/seed.ts
```

### 2. Start Backend Server
```bash
npm run dev
# Or run with tsx:
npx tsx src/index.ts
# Server starts on http://localhost:5000
```

### 3. Start Frontend Client
```bash
cd ../client
npm install
npm run dev
# Vite client starts on http://localhost:5173
```

---

## 🔑 Demo Accounts (Local Development Only)

> [!CAUTION]
> **Production Security Note**:
> The demo credentials listed below are strictly meant for local development and testing. `src/seed.ts` automatically aborts execution if `NODE_ENV=production` is detected unless `ALLOW_PRODUCTION_SEED=true` is explicitly provided alongside custom `SEED_ADMIN_PASSWORD` and `SEED_SUPERADMIN_PASSWORD` environment variables. Never deploy with default passwords.

The database comes pre-seeded with realistic institutional demo accounts:

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@college.edu` | `admin123` |
| **Super Admin** | `superadmin@college.edu` | `superadmin123` |
| **Faculty / Coordinator** | `faculty@college.edu` | `faculty123` |
| **AIML Department HOD** | `aiml.hod@college.edu` | `faculty123` |

*(Quick one-click demo login buttons are also provided on the `/login` page for convenience).*

---

## 🛠️ API Endpoints Summary

- `POST /api/auth/login` - User and admin authentication
- `POST /api/auth/register` - New user registration
- `GET /api/halls` - List all halls with live today status
- `GET /api/availability` - Date-range availability matrix
- `GET /api/bookings` - List bookings with search and filters
- `POST /api/bookings` - Create whole-hall reservation request
- `PATCH /api/bookings/:id/approve` - Approve request (Admin only)
- `PATCH /api/bookings/:id/reject` - Reject request (Admin only)
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `GET /api/blocked-dates` & `POST /api/blocked-dates` - Date restrictions
- `GET /api/maintenance` & `POST /api/maintenance` - Scheduled downtime
- `GET /api/holidays` - College holidays
- `GET /api/reports/summary` - Statistical analytics for charts
- `GET /api/reports/export-csv` - Downloadable bookings CSV
- `GET /api/activity-logs` - Audit trail
- `GET /api/settings` & `PUT /api/settings` - System branding & rules
