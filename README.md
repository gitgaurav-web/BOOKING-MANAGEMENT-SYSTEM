# Sri Sairam College of Engineering
## Central Transport & Vehicle Reservation Portal (CTVRP)

> **Institutional Mobility & Campus Fleet Management System**  
> *Affiliated to VTU Belagavi & Approved by AICTE | NAAC 'A+' Grade | ISO 9001:2015*  
> *Sai Leo Nagar, Samandhur PO, Anekal, Bengaluru, Karnataka 562106*

---

### 1. System Overview

The **Central Transport & Vehicle Reservation Portal** is an enterprise-grade institutional fleet logistics platform tailored specifically for higher educational engineering institutions. Rather than booking seminar halls, Academic Faculty, Department Heads, Student Clubs, and Administrative Officers requisition campus fleet assets:
- **College Buses (52-Seater & 32-Seater)** for batch industrial visits and student campus tours.
- **College Vans & Tempo Travellers (18-Seater & 14-Seater)** for sports contingents and research delegations.
- **Official Staff Cars & Sedans (4-Seater)** for confidential VTU exam duties and administrative liaison.
- **VIP Escort SUVs (7-Seater)** for accreditation peer teams (NBA/NAAC) and distinguished keynote speakers.
- **24x7 Campus Life Support Ambulance** for emergency medical care.

---

### 2. Multi-Tier Institutional Workflow

```
[Faculty / Club Lead]
       │
       ▼  (1) Requisition Wizard (Headcount, Schedule, Purpose, Sanction Doc)
[Pending HOD Endorsement]
       │
       ▼  (2) HOD Review & Budget Sanction
[Transport Officer Allocation Matrix]
       │
       ▼  (3) Conflict Prevention Engine: Vehicle & Driver Allocation
[Security Gate Pass Terminal]
       │
       ├──► (4) Outward Gate Clearance (Start Odometer, Driver Fitness Check, Gate Out Time)
       │         └─ Status: IN_TRANSIT (Live Road Dispatched)
       │
       └──► (5) Inward Gate Clearance (End Odometer, Auto-calculated KM, Fuel, Tolls)
                 └─ Status: COMPLETED (Fleet asset returned to Available Pool)
```

---

### 3. Architecture & Tech Stack

#### **Frontend (`/client`)**
- **Framework:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS v4 + Plus Jakarta Sans + JetBrains Mono
- **Routing:** React Router v7
- **Icons:** `lucide-react`
- **Charts:** `recharts` (Fleet Utilization, Kilometric Trends, Department Distribution)
- **Pass Engine:** `jspdf` + `html2canvas` + `qrcode.react` + `canvas-confetti`
- **Timezone:** Anchored strictly to `Asia/Kolkata` (Indian Standard Time UTC+05:30)

#### **Backend (`/server`)**
- **Runtime & Framework:** Node.js v24 + Express + TypeScript (`tsx`)
- **Database ORM:** Prisma ORM v5.22 with SQLite zero-config local mode and PostgreSQL / Supabase enterprise dual-URL support
- **Security:** JWT authentication, bcryptjs password hashing, role-based authorization
- **Gate Pass Generator:** Server-side `pdfkit` + `qrcode` with official College Transport Seal & security sign-off boxes
- **File Storage:** `multer` with MIME restriction to `./uploads` for HOD/Principal sanction orders

---

### 4. Demo Personas & 1-Click Role Switcher

You can switch between institutional roles at any time using the active persona dropdown in the top navigation bar:

| Role | Persona Name | Designation | Responsibility |
|---|---|---|---|
| `TRANSPORT_OFFICER` | Dr. R. Rajendran | Fleet Superintendent | Central scheduling, driver roster, vehicle conflict resolution |
| `HOD` | Dr. C. Valarmathi | Head of Dept - CSE | Department requisition approvals & budget endorsement |
| `FACULTY` | Prof. K. Arunkumar | Mech IV Coordinator | Submitting vehicle requisitions & headcount breakdown |
| `SECURITY_OFFICER` | Havildar Subbaiah (Retd.) | Chief Security Warden | Gate Outward & Inward odometer logging & pass verification |
| `ADMIN` | Dr. B. Shadaksharappa | Principal & Head of Inst. | Institutional oversight, audit reports, fleet analytics |

*Demo Password for all accounts:* `admin123`

---

### 5. Running the Project Locally

```bash
# 1. Install all monorepo dependencies
npm install

# 2. Setup database schema & seed realistic fleet data
npm run seed

# 3. Start development servers (Express API on :5000 + Vite Client on :5173)
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
