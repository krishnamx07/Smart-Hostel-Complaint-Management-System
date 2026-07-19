require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const path         = require('path');

// ─── Global Error Handling (Stability Fix) ──────────────────
process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const authMiddleware = require('./middleware/authMiddleware');
const { getNotifications, markAsRead, markAllRead } = require('./controllers/notificationsController');

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Frontend ──────────────────────────────────────────
const frontendPath = path.resolve(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/staff',   require('./routes/staff'));
app.use('/api/admin',   require('./routes/admin'));

// ─── Notifications (shared across roles) ─────────────────────
app.get ('/api/notifications',             authMiddleware, getNotifications);
app.put  ('/api/notifications/read-all',   authMiddleware, markAllRead);
app.put  ('/api/notifications/:id/read',   authMiddleware, markAsRead);

// ─── Page Routing (SPA-style fallback to HTML files) ─────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'login.html'));
});

const serveHtml = (file) => (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', file));
};

app.get('/login',    serveHtml('login.html'));
app.get('/register', serveHtml('register.html'));

// Student pages
app.get('/student/dashboard',       serveHtml('student/dashboard.html'));
app.get('/student/raise-complaint', serveHtml('student/raise-complaint.html'));
app.get('/student/my-complaints',   serveHtml('student/my-complaints.html'));
app.get('/student/complaint/:id',   serveHtml('student/complaint-detail.html'));
app.get('/student/profile',         serveHtml('student/profile.html'));

// Staff pages
app.get('/staff/dashboard',         serveHtml('staff/dashboard.html'));
app.get('/staff/complaints',        serveHtml('staff/complaints.html'));
app.get('/staff/complaint/:id',     serveHtml('staff/complaint-detail.html'));
app.get('/staff/profile',           serveHtml('staff/profile.html'));

// Admin pages
app.get('/admin/dashboard',         serveHtml('admin/dashboard.html'));
app.get('/admin/complaints',        serveHtml('admin/complaints.html'));
app.get('/admin/complaint/:id',     serveHtml('admin/complaint-detail.html'));
app.get('/admin/user-management',   serveHtml('admin/user-management.html'));
app.get('/admin/create-user',       serveHtml('admin/create-user.html'));
app.get('/admin/edit-user/:id',     serveHtml('admin/edit-user.html'));
app.get('/admin/privilege-manager', serveHtml('admin/privilege-manager.html'));
app.get('/admin/reports',           serveHtml('admin/reports.html'));

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Bootstrap Accounts (Auto-Repair) ───────────────────────
async function bootstrapAccounts() {
  try {
    const db = require('./db/db');
    const demoUsers = [
      { name: 'Super Admin',  email: 'admin@hostel.com', pass: 'admin123', role: 'admin' },
      { name: 'Ravi Kumar',   email: 'ravi@hostel.com',  pass: 'Staff@123', role: 'staff' },
      { name: 'Arjun Sharma', email: 'arjun@hostel.com', pass: 'admin123', role: 'student' }
    ];

    // 1. Ensure the column is 'password' (migration helper)
    try {
      await db.query('ALTER TABLE users CHANGE COLUMN password_hash password VARCHAR(255)');
      console.log('✅ Database migrated: password_hash -> password');
    } catch (e) { /* already corrected */ }

    for (const u of demoUsers) {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [u.email]);
      
      if (rows.length === 0) {
        console.log(`🔧 Bootstrapping: Account ${u.email} missing. Creating...`);
        try {
          await db.query(
            'INSERT INTO users (full_name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [u.name, u.email, u.pass, u.role, true]
          );
        } catch (e) {
          await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [u.name, u.email, u.pass, u.role, true]
          );
        }
      } else {
        // Force sync the password and status
        try {
          await db.query('UPDATE users SET password = ?, is_active = TRUE WHERE email = ?', [u.pass, u.email]);
        } catch (e) {
          await db.query('UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?', [u.pass, u.email]);
        }
      }
    }
    console.log('✅ All demo accounts verified and synced.');
  } catch (err) {
    console.error('⚠️ Bootstrap failed:', err.message);
  }
}

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
bootstrapAccounts().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏠 Hostel Complaint System running at http://localhost:${PORT}`);
    console.log(`📝 Login at: http://localhost:${PORT}/login`);
  });
});
