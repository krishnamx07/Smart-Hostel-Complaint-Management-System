# Smart Hostel Complaint Management System 🏢⚙️

![Project Status](https://img.shields.io/badge/Status-Completed-success) ![Tech Stack](https://img.shields.io/badge/Tech-Node.js%20%7C%20MySQL%20%7C%20Vanilla%20JS-blue)

A robust web application built specifically to streamline the grievance reporting and resolution workflow inside a hostel environment. This project is heavily focused on **Database Administration (DBA) concepts**, featuring complex SQL entities, highly normalized schemas, views, stored procedures, and triggers to enforce business logic on the database side. 

---

## 🌟 Key Features

### 👤 Role-Based Access Control (RBAC)
- **Student Portal:** Raise complaints, track status, view priority and resolution updates.
- **Staff Portal:** View assigned complaints, update progress (Pending ➔ In Progress ➔ Resolved/Rejected). 
- **Admin Dashboard:** Total system oversight. Create/manage users, monitor complaint lifecycle, view analytics and reports.

### 📊 DBA & Data Architecture Focus
This is an academic-level DBA project. Key database features include:
* **Complex Referencing:** 5 separate tables (`users`, `complaints`, `complaint_logs`, `staff_profiles`, `notifications`) highly normalized.
* **Audit Triggers:** Triggers strictly enforce audit logging. Any transition in a complaint’s status automatically executes a `AFTER UPDATE` trigger to populate the `complaint_logs` table.
* **Stored Procedures:** Assigning complaints utilizes Stored Procedures (`assign_complaint`) which encapsulate assignment updates, notifications, and logging into a singular atomic transaction limit.
* **Optimized Views:** Live metric aggregation is done through Views (`pending_complaints_view`, `complaint_stats_view`) for high-performance dashboard population without redundant query parsing.

---

## 🚀 Technology Stack

- **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (DOM manipulation and routing)
- **Backend Framework:** Node.js, Express.js
- **Database:** MySQL 8.0 
- **Database Driver:** `mysql2/promise` (Node)
- **Authentication:** Bycrypt & JWT (JSON Web Tokens)

---

## 💻 Getting Started 

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v16+)
- MySQL Server 8.0+

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Username/Smart-Hostel-Complaint-Management.git
   cd Smart-Hostel-Complaint-Management
   ```

2. **Database Configuration**
   - Open your MySQL Workbench or MySQL CLI.
   - Run the initialization script provided at `backend/db/schema.sql` to establish the DB structure.
   - Run `backend/db/seed.sql` to generate demo accounts and initial test values.
   
3. **Environment Setup**
   - Head over to the backend root directory.
   ```bash
   cd backend
   ```
   - Make sure you possess a `.env` file containing your local sql connection details:
     ```env
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=hostel_db
     JWT_SECRET=hostel_super_secret_jwt_key_2024
     JWT_EXPIRES_IN=7d
     PORT=5000
     ```

4. **Install Dependencies & Run**
   - While still inside the `backend` folder, install your node modules and boot the server:
     ```bash
     npm install
     npm run dev
     ```

5. **Start Client**
   - Depending on your preferred browser setup, you can simply run your HTTP application. You can view the application by loading `frontend/pages/login.html` via Live Server or just double clicking it!

---

## 🔑 Demo Accounts

Use these accounts to test the application's different views.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@hostel.com` | `admin123` |
| **Staff** | `ravi@hostel.com` | `Staff@123` |
| **Student** | `arjun@hostel.com` | `admin123` |

---

## 💡 Architecture & Security 

- **Token Guard:** Navigation via backend calls is secured behind a JSON Web Token (JWT) bearer schema utilizing a middleware (`authMiddleware.js`).
- **Role Guard:** Endpoints meant strictly for admin use check `req.user.role` through the `roleGuard.js` middleware.
- **SQL Injection Safety:** Dynamic query injections are thwarted entirely via robust parameterization and Prepared Statements via `mysql2`.
