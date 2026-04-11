# CRCCF HRMS — Human Resource Management System

A full-stack, production-ready HRMS built with Next.js, Express.js, and MongoDB.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Start the Backend

```bash
cd backend
# Make sure .env is configured (edit MONGODB_URI if needed)
npm run dev        # starts on port 5000
```

### 2. Seed the Database (first time only)

```bash
cd backend
npm run seed
```

This creates:
- **HR Admin**: `username=admin` / `password=Admin@123`
- **Employees**: `EMP0001` through `EMP0005` with default passwords

### 3. Start the Frontend

```bash
cd frontend
npm run dev        # starts on port 3000
```

### 4. Open the App

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| HR Admin | `admin` | `Admin@123` |
| Employee | `EMP0001` | `rahul0315` |
| Employee | `EMP0002` | `priya0722` |

**Password pattern**: `firstname (lowercase) + MM + DD of DOB`

---

## 📁 Project Structure

```
hrms/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, upload, error handlers
│   │   ├── models/         # MongoDB schemas
│   │   └── routes/         # API endpoints
│   ├── uploads/            # Uploaded files
│   ├── server.js           # Express entry point
│   ├── seed.js             # Database seeder
│   └── .env                # Environment config
│
└── frontend/
    └── src/
        ├── app/            # Next.js App Router pages
        ├── components/     # UI + Layout components
        ├── context/        # Auth context
        └── lib/            # API client
```

---

## 🧩 Features

- ✅ JWT-based authentication (Employee ID + default password)
- ✅ Role-based access (HR Admin / Employee)
- ✅ Employee CRUD + auto ID generation
- ✅ HR can edit/reset Employee ID & passwords
- ✅ Profile change request approval workflow
- ✅ Project management with time tracking (given vs expected)
- ✅ Employee ↔ Project many-to-many assignments
- ✅ Attendance marking & leave request workflow
- ✅ Payroll generation + PDF payslip download
- ✅ Performance reviews with star ratings
- ✅ Document upload & verification
- ✅ Recruitment notices with Google Form links
- ✅ Real-time notifications
- ✅ Reports & analytics with charts
- ✅ Responsive design (mobile + desktop)

---

## 🗄️ API Base URL

`http://localhost:5000/api`
