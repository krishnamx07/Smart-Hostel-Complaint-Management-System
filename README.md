# 🏢 Smart Hostel Complaint Management System

> A modern, role-based complaint management platform designed to streamline grievance reporting and resolution in hostel environments. Built with a strong focus on database architecture, security, and user experience.

<div align="center">

[![Project Status](https://img.shields.io/badge/Status-Completed%20%26%20Production%20Ready-success?style=for-the-badge)](https://github.com/Shreekrishnapatil7588/Smart-Hostel-Complaint-Management)
[![Tech Stack](https://img.shields.io/badge/Tech-Node.js%20%7C%20MySQL%20%7C%20Vanilla%20JS-0066cc?style=for-the-badge)](https://github.com)
[![Database](https://img.shields.io/badge/Database-MySQL%208.0-orange?style=for-the-badge)](https://www.mysql.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](#) • [Documentation](#-project-structure) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [API Endpoints](#-api-endpoints)
- [Demo Accounts](#-demo-accounts)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The **Smart Hostel Complaint Management System** is a comprehensive web application engineered to replace traditional, paper-based grievance systems in hostel environments. It provides an intuitive interface for students to report issues, track resolution progress, and for staff and administrators to manage complaints efficiently.

This project is **heavily focused on Database Administration (DBA) concepts**, featuring:
- ✅ Complex SQL schemas with high normalization
- ✅ Advanced triggers for audit logging
- ✅ Optimized views for real-time analytics
- ✅ Stored procedures for atomic transactions
- ✅ JWT-based authentication and role-based access control

**Perfect for:** Hostels, dormitories, co-living spaces, and educational institutions seeking a modern complaint management solution.

---

## ⭐ Key Features

### 👤 **Role-Based Access Control (RBAC)**

#### Student Portal
- 📝 **Raise Complaints** - Submit new grievances with detailed descriptions and attachments
- 📊 **Track Status** - Real-time updates on complaint lifecycle (Pending → In Progress → Resolved)
- 📈 **View Analytics** - Personal complaint history and resolution metrics
- 🔔 **Notifications** - Instant alerts on status changes and staff updates

#### Staff Portal
- 📋 **Complaint Queue** - View all assigned complaints with priority indicators
- ✅ **Update Progress** - Manage complaint workflows with detailed notes
- 📸 **Attach Evidence** - Document resolution with photos and files
- 👥 **Escalation Management** - Forward complex issues to administrators

#### Admin Dashboard
- 🎛️ **System Oversight** - Full control over all complaints and users
- 👨‍💼 **User Management** - Create, edit, and manage student and staff accounts
- 📊 **Advanced Analytics** - Comprehensive reports on complaint trends and staff performance
- ⚙️ **System Configuration** - Configure complaint categories, priorities, and workflows

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Student      │  │    Staff       │  │     Admin      │    │
│  │   Portal       │  │    Portal      │  │   Dashboard    │    │
│  │ (HTML/CSS/JS)  │  │ (HTML/CSS/JS)  │  │  (HTML/CSS/JS) │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS/REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│                      (Node.js/Express)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Authentication & Authorization                 │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │ JWT Middleware  │  │  Role Guard Middleware       │  │  │
│  │  └─────────────────┘  └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Routes & Controllers                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ Auth API │ │Complaint │ │  User    │ │Dashboard │   │  │
│  │  │          │ │   API    │ │   API    │ │   API    │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MySQL Protocol
┌──────────────────────────▼──────────────────────────────────────┐
│                     DATABASE LAYER                              │
│                      (MySQL 8.0)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌──────────┐  ┌────────┐  ┌────────────┐              │  │
│  │  │  Tables  │  │ Triggers│  │  Views     │              │  │
│  │  │          │  │         │  │            │              │  │
│  │  │ • users  │  │ Audit   │  │ • Stats    │              │  │
│  │  │ • issues │  │ Logging │  │ • Pending  │              │  │
│  │  │ • logs   │  │ Update  │  │ • Reports  │              │  │
│  │  │ • staff  │  │ Cascade │  │            │              │  │
│  │  │ • notifs │  │ Cleanup │  │            │              │  │
│  │  └──────────┘  └────────┘  └────────────┘              │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │    Stored Procedures (Atomic Transactions)       │  │  │
│  │  │    • assign_complaint()                          │  │  │
│  │  │    • resolve_complaint()                         │  │  │
│  │  │    • get_complaint_analytics()                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic markup & structure |
| **CSS3** | Modern styling with Flexbox & Grid |
| **Vanilla JavaScript** | DOM manipulation & client-side routing |
| **LocalStorage** | Client-side session management |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework & routing |
| **Bcrypt** | Password hashing & security |
| **JWT** | Token-based authentication |
| **mysql2/promise** | Async MySQL driver with promise support |

### Database
| Technology | Purpose |
|-----------|---------|
| **MySQL 8.0+** | Relational database |
| **Triggers** | Automated audit logging |
| **Stored Procedures** | Business logic encapsulation |
| **Views** | Real-time analytics aggregation |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

```bash
✓ Node.js v16 or higher    (https://nodejs.org)
✓ MySQL Server 8.0+        (https://www.mysql.com/downloads)
✓ Git                       (https://git-scm.com)
✓ Postman (optional)       (For API testing)
```

**Verify installations:**
```bash
node --version
npm --version
mysql --version
```

### Installation & Setup

#### Step 1: Clone the Repository

```bash
git clone https://github.com/krishnamx07/Smart-Hostel-Complaint-Management-System.git
cd Smart-Hostel-Complaint-Management
```

#### Step 2: Database Setup

1. **Open MySQL CLI or Workbench:**
   ```bash
   mysql -u root -p
   ```

2. **Execute the schema initialization:**
   ```bash
   source backend/db/schema.sql;
   source backend/db/seed.sql;
   ```

   Or if using MySQL Workbench, import these SQL files directly.

3. **Verify the database:**
   ```bash
   SHOW DATABASES;
   USE hostel_db;
   SHOW TABLES;
   ```

#### Step 3: Environment Configuration

Navigate to the backend directory and create a `.env` file:

```bash
cd backend
touch .env
```

Add the following environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_db

# JWT Configuration
JWT_SECRET=hostel_super_secret_jwt_key_2024_secure_change_this
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Logging Level
LOG_LEVEL=debug
```

**⚠️ Security Note:** Change the `JWT_SECRET` to a strong, unique value in production.

#### Step 4: Install Dependencies & Run Backend

```bash
# Install npm packages
npm install

# Start the development server
npm run dev
```

You should see:
```
✓ Database connected successfully
✓ Server running on http://localhost:5000
```

#### Step 5: Start the Frontend

The frontend doesn't require a build step. Simply:

**Option A: Using Live Server (VS Code)**
1. Install the "Live Server" extension
2. Right-click on `frontend/pages/login.html`
3. Click "Open with Live Server"

**Option B: Using Python's built-in server**
```bash
cd frontend
python -m http.server 8000
# Navigate to http://localhost:8000/pages/login.html
```

**Option C: Direct file access**
```bash
# Simply double-click frontend/pages/login.html in your file explorer
```

---

## 📁 Project Structure

```
Smart-Hostel-Complaint-Management/
│
├── frontend/                          # Client-side application
│   ├── assets/
│   │   ├── css/                       # Stylesheets
│   │   │   ├── common.css
│   │   │   ├── student.css
│   │   │   ├── staff.css
│   │   │   └── admin.css
│   │   ├── js/                        # JavaScript logic
│   │   │   ├── api.js                 # API communication layer
│   │   │   ├── auth.js                # Authentication logic
│   │   │   ├── router.js              # Client-side routing
│   │   │   └── utils.js               # Utility functions
│   │   └── images/                    # Icons & images
│   └── pages/
│       ├── login.html                 # Authentication page
│       ├── student-dashboard.html     # Student portal
│       ├── staff-dashboard.html       # Staff portal
│       └── admin-dashboard.html       # Admin panel
│
├── backend/                           # Server-side application
│   ├── config/
│   │   ├── database.js                # MySQL connection pool
│   │   └── env.js                     # Environment configuration
│   ├── middlewares/
│   │   ├── authMiddleware.js          # JWT verification
│   │   └── roleGuard.js               # Role-based access control
│   ├── controllers/
│   │   ├── authController.js          # Authentication logic
│   │   ├── complaintController.js     # Complaint management
│   │   ├── userController.js          # User administration
│   │   └── dashboardController.js     # Analytics & reports
│   ├── routes/
│   │   ├── authRoutes.js              # Auth endpoints
│   │   ├── complaintRoutes.js         # Complaint endpoints
│   │   ├── userRoutes.js              # User endpoints
│   │   └── dashboardRoutes.js         # Dashboard endpoints
│   ├── db/
│   │   ├── schema.sql                 # Database structure
│   │   ├── seed.sql                   # Demo data
│   │   └── procedures.sql             # Stored procedures
│   ├── .env                           # Environment variables (create this)
│   ├── server.js                      # Express app entry point
│   └── package.json                   # Node dependencies
│
└── README.md                          # Project documentation
```

---

## 💾 Database Design

### ER Diagram

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ password_hash       │
│ full_name           │
│ role (Admin/Staff)  │
│ created_at          │
└──────────┬──────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
    ┌──────▼─────────────┐      ┌───────────▼──────┐
    │  staff_profiles     │      │  complaints     │
    ├────────────────────┤      ├──────────────────┤
    │ id (PK)            │      │ id (PK)          │
    │ user_id (FK)       │      │ student_email    │
    │ department         │      │ title            │
    │ phone_number       │      │ description      │
    │ availability_status│      │ category         │
    └────────────────────┘      │ priority         │
                                │ status           │
        ┌───────────────────────▶│ assigned_to     │
        │                       │ created_at       │
        │                       │ updated_at       │
        │                       └──────────┬───────┘
        │                                  │
        │                      ┌───────────▼──────────────┐
        │                      │   complaint_logs         │
        │                      ├──────────────────────────┤
        │                      │ id (PK)                  │
        │                      │ complaint_id (FK)        │
        │                      │ action_type              │
        │                      │ old_status               │
        │                      │ new_status               │
        │                      │ staff_comment            │
        │                      │ timestamp                │
        │                      │ created_by_user_id (FK)  │
        │                      │ (triggers auto-populate) │
        └──────────────────────┴──────────────────────────┘

        ┌──────────────────────────────────┐
        │      notifications               │
        ├──────────────────────────────────┤
        │ id (PK)                          │
        │ user_id (FK)                     │
        │ complaint_id (FK)                │
        │ message                          │
        │ is_read                          │
        │ created_at                       │
        └──────────────────────────────────┘
```

### Table Details

#### **users**
Stores all user accounts across roles.
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('Student', 'Staff', 'Admin') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **complaints**
Core table for all grievances.
```sql
CREATE TABLE complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
  assigned_to INT,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

#### **complaint_logs** (Audit Trail)
Auto-populated by triggers for complete audit trail.
```sql
CREATE TABLE complaint_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  action_type VARCHAR(50),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  staff_comment TEXT,
  created_by_user_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);
```

#### **staff_profiles**
Additional information for staff members.
```sql
CREATE TABLE staff_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  department VARCHAR(100),
  phone_number VARCHAR(20),
  availability_status VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **notifications**
Real-time notifications for users.
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  complaint_id INT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id)
);
```

### Key Database Features

**🔄 Triggers**
- `after_complaint_update`: Auto-logs all status changes
- `before_complaint_delete`: Prevents orphaned logs
- `after_notification_insert`: Notifies relevant users

**📋 Stored Procedures**
```sql
-- Assign complaint atomically
CALL assign_complaint(complaint_id, staff_user_id, initial_comment);

-- Get complaint analytics
CALL get_complaint_analytics(start_date, end_date);
```

**📊 Views**
```sql
-- Pending complaints dashboard
SELECT * FROM pending_complaints_view;

-- Staff performance metrics
SELECT * FROM staff_performance_view;

-- Category-wise complaint distribution
SELECT * FROM complaint_stats_view;
```

---

## 🔌 API Endpoints

### Authentication Endpoints

```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login with credentials
POST   /api/auth/logout          Logout & invalidate token
GET    /api/auth/validate        Validate current token
```

### Complaint Management Endpoints

```
POST   /api/complaints            Create new complaint
GET    /api/complaints            Get all complaints (role-based)
GET    /api/complaints/:id        Get specific complaint details
PUT    /api/complaints/:id        Update complaint (staff/admin)
DELETE /api/complaints/:id        Delete complaint (admin only)
POST   /api/complaints/:id/assign Assign complaint to staff
```

### User Management Endpoints

```
GET    /api/users                 Get all users (admin)
POST   /api/users                 Create new user (admin)
GET    /api/users/:id             Get user details (admin)
PUT    /api/users/:id             Update user (admin/self)
DELETE /api/users/:id             Delete user (admin)
```

### Dashboard & Analytics Endpoints

```
GET    /api/dashboard/stats       Get overall statistics
GET    /api/dashboard/pending     Get pending complaints
GET    /api/dashboard/my-assigned Get assigned complaints (staff)
GET    /api/dashboard/reports     Generate detailed reports
GET    /api/dashboard/performance Get staff performance metrics
```

---

## 👥 Demo Accounts

Test the application using these pre-configured accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@hostel.com` | `admin123` | Full system control |
| **Staff** | `ravi@hostel.com` | `Staff@123` | Complaint management |
| **Staff** | `priya@hostel.com` | `Staff@123` | Complaint management |
| **Student** | `arjun@hostel.com` | `admin123` | Submit & track complaints |
| **Student** | `divya@hostel.com` | `admin123` | Submit & track complaints |

> 💡 **Tip:** After first login, you can use "Forgot Password" to reset and create new credentials.

---

## 🔐 Security Features

### Authentication & Authorization

#### JWT Token-Based Security
- **Token Generation:** Issued on successful login with 7-day expiry
- **Token Storage:** Stored securely in browser (with HTTPS in production)
- **Token Validation:** All API requests require valid JWT token
- **Token Refresh:** Automatic refresh on valid request

```javascript
// Token Structure
{
  id: user.id,
  email: user.email,
  role: user.role,
  iat: issued_at_timestamp,
  exp: expiration_timestamp
}
```

#### Middleware Security

**Auth Middleware** (`authMiddleware.js`)
- Verifies JWT signature
- Checks token expiration
- Extracts user info into `req.user`
- Returns 401 Unauthorized if invalid

**Role Guard Middleware** (`roleGuard.js`)
- Verifies user role matches endpoint requirements
- Prevents privilege escalation
- Returns 403 Forbidden if unauthorized role

```javascript
// Usage in routes
router.post('/admin/create-user', 
  authMiddleware,
  roleGuard(['Admin']),
  createUserController
);
```

### Data Security

#### Password Security
- **Hashing Algorithm:** Bcrypt with 10 salt rounds
- **Hash Function:** `bcrypt.hash(password, 10)`
- **Verification:** `bcrypt.compare(input, hash)`
- **Never Stored:** Plain passwords never stored in database

#### SQL Injection Prevention
- **Parameterized Queries:** All dynamic queries use placeholders
- **Prepared Statements:** `mysql2/promise` handles parameter binding
- **No String Concatenation:** Query builders prevent injection

```javascript
// ✅ SAFE - Parameterized query
const query = 'SELECT * FROM users WHERE email = ?';
const [rows] = await pool.execute(query, [email]);

// ❌ UNSAFE - String concatenation (NEVER USE)
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### Database Security

#### Audit Logging
- **Automatic Tracking:** All complaint changes logged via triggers
- **Who Changed What:** Includes user ID and timestamp
- **Status Transitions:** Records old and new status
- **Comments:** Staff notes attached to log entries

#### Access Control at DB Level
- **Role-Based Queries:** Views filter data by user role
- **User Isolation:** Students see only their complaints
- **Staff Assignment:** Complaints assigned explicitly to staff
- **Admin Oversight:** Admins have unrestricted access

---

## 🎨 User Interface Features

### Student Portal
- Clean, intuitive dashboard
- Quick complaint submission form
- Real-time status tracking
- Notification bell with alerts
- Complaint history with filters
- Download complaint documents

### Staff Portal
- Assigned complaints queue
- Priority-based sorting
- Status update workflow
- Add resolution notes & evidence
- Escalation to admin
- Performance statistics

### Admin Dashboard
- System-wide statistics
- User management interface
- Complaint lifecycle overview
- Advanced analytics & reports
- System logs & audit trail
- Configuration panel

---

## 🧪 Testing

### Using Postman

1. Import the included `postman_collection.json`
2. Set environment variables:
   ```json
   {
     "base_url": "http://localhost:5000/api",
     "token": "your_jwt_token_here"
   }
   ```
3. Test endpoints in sequence

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostel.com","password":"admin123"}'

# Create complaint
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Water Issue","description":"No water in Room 201","category":"Maintenance"}'
```

---

## 📊 Performance Optimizations

- **Database Indexing:** Indexes on frequently queried columns (email, status, created_at)
- **Query Optimization:** Views aggregate data efficiently
- **Connection Pooling:** MySQL connection pool for better resource management
- **Frontend Caching:** LocalStorage reduces API calls
- **Pagination:** Large datasets paginated for better performance

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Smart-Hostel-Complaint-Management.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Include before/after screenshots if applicable

### Code Style Guidelines
- Use consistent indentation (2 spaces)
- Follow naming conventions (camelCase for JS, snake_case for SQL)
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


## 🙏 Acknowledgments

- **MySQL Documentation** for database concepts
- **Express.js Community** for framework excellence
- **Bcrypt & JWT** for security best practices
- **All Contributors** who have helped improve this project

---




</div>
