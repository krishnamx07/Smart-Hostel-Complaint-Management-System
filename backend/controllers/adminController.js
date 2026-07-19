const db     = require('../db/db');
const mysqldump = require('mysqldump');
const mysql     = require('mysql2/promise');
const fs        = require('fs');
const path      = require('path');

// ─── GET /api/admin/dashboard ──────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    // Overall stats
    const [overall] = await db.query(`
      SELECT
        COUNT(*) AS total_complaints,
        SUM(status = 'pending')     AS pending,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved')    AS resolved,
        SUM(status = 'rejected')    AS rejected,
        SUM(DATE(created_at) = CURDATE()) AS submitted_today,
        SUM(DATE(updated_at) = CURDATE() AND status = 'resolved') AS resolved_today
      FROM complaints
    `);

    // Total users per role
    const [userCounts] = await db.query(`
      SELECT role, COUNT(*) AS count FROM users WHERE is_active = TRUE GROUP BY role
    `);

    // Complaints by category (uses view would require SELECT, using direct query for flexibility)
    const [byCategory] = await db.query(`SELECT * FROM complaint_stats_view`);

    // Recent 5 complaints
    const [recent] = await db.query(`
      SELECT c.complaint_id, c.category, c.title, c.priority, c.status,
             u.full_name AS student_name, u.room_number, c.created_at
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      ORDER BY c.created_at DESC LIMIT 5
    `);

    // Complaints over last 7 days
    const [weeklyTrend] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM complaints
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    return res.json({ success: true, overall: overall[0], userCounts, byCategory, recent, weeklyTrend });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/complaints ────────────────────────────────
const getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority, assigned_to, page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status)      { where += ' AND c.status = ?';      params.push(status);      }
    if (category)    { where += ' AND c.category = ?';    params.push(category);    }
    if (priority)    { where += ' AND c.priority = ?';    params.push(priority);    }
    if (assigned_to) { where += ' AND c.assigned_to = ?'; params.push(assigned_to); }

    const [complaints] = await db.query(`
      SELECT c.complaint_id, c.category, c.title, c.priority, c.status,
             c.created_at, c.updated_at,
             u.full_name AS student_name, u.room_number, u.email AS student_email,
             s.full_name AS staff_name
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      LEFT JOIN users s ON c.assigned_to = s.user_id
      ${where}
      ORDER BY FIELD(c.priority,'high','medium','low'), c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM complaints c JOIN users u ON c.student_id = u.user_id ${where}`,
      params
    );

    return res.json({
      success: true, complaints,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/complaints/:id ────────────────────────────
const getAdminComplaintDetail = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.full_name AS student_name, u.room_number, u.email AS student_email, u.phone AS student_phone,
             s.full_name AS staff_name, s.email AS staff_email
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      LEFT JOIN users s ON c.assigned_to = s.user_id
      WHERE c.complaint_id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const [logs] = await db.query(`
      SELECT cl.*, u.full_name AS changed_by_name, u.role AS changed_by_role
      FROM complaint_logs cl
      JOIN users u ON cl.changed_by = u.user_id
      WHERE cl.complaint_id = ?
      ORDER BY cl.changed_at ASC
    `, [req.params.id]);

    // Staff list for assignment dropdown
    const [staffList] = await db.query(
      'SELECT user_id, full_name, email FROM users WHERE role = "staff" AND is_active = TRUE'
    );

    return res.json({ success: true, complaint: rows[0], logs, staffList });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PUT /api/admin/complaints/:id ────────────────────────────
const updateComplaint = async (req, res) => {
  try {
    const adminId     = req.user.user_id;
    const complaintId = req.params.id;
    const { status, assigned_to, remark } = req.body;

    const [rows] = await db.query('SELECT * FROM complaints WHERE complaint_id = ?', [complaintId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const old = rows[0];

    if (assigned_to && assigned_to !== old.assigned_to) {
      // Use stored procedure for assignment
      await db.query('CALL assign_complaint(?, ?, ?)', [complaintId, assigned_to, adminId]);
    }

    if (status && status !== old.status) {
      await db.query('UPDATE complaints SET status = ? WHERE complaint_id = ?', [status, complaintId]);
      await db.query(
        'INSERT INTO complaint_logs (complaint_id, changed_by, old_status, new_status, remark) VALUES (?, ?, ?, ?, ?)',
        [complaintId, adminId, old.status, status, remark || 'Status updated by admin.']
      );

      // Notify student
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [old.student_id, `Your complaint "${old.title}" status updated to: ${status.replace('_',' ')}.`]
      );
    }

    return res.json({ success: true, message: 'Complaint updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (role)   { where += ' AND role = ?'; params.push(role); }
    if (search) { where += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [users] = await db.query(`
      SELECT user_id, full_name, email, role, room_number, phone, is_active, created_at
      FROM users ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);

    return res.json({
      success: true, users,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/admin/users ────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role, room_number, phone, department, shift } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, role, room_number, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), password, role, room_number || null, phone || null]
    );

    const newUserId = result.insertId;

    // Staff profile
    if (role === 'staff' && department) {
      await db.query(
        'INSERT INTO staff_profiles (staff_id, department, shift) VALUES (?, ?, ?)',
        [newUserId, department, shift || 'morning']
      );
    }

    // Create MySQL DB user and grant privileges
    try {
      const dbUsername = `${role}_user_${newUserId}`;
      const dbPassword = `hostel_${role}_${newUserId}!`;

      await db.query(`CREATE USER IF NOT EXISTS '${dbUsername}'@'localhost' IDENTIFIED BY '${dbPassword}'`);

      if (role === 'student') {
        await db.query(`GRANT SELECT ON hostel_db.users TO '${dbUsername}'@'localhost'`);
        await db.query(`GRANT SELECT, INSERT ON hostel_db.complaints TO '${dbUsername}'@'localhost'`);
        await db.query(`GRANT SELECT ON hostel_db.notifications TO '${dbUsername}'@'localhost'`);
      } else if (role === 'staff') {
        await db.query(`GRANT SELECT ON hostel_db.users TO '${dbUsername}'@'localhost'`);
        await db.query(`GRANT SELECT, UPDATE ON hostel_db.complaints TO '${dbUsername}'@'localhost'`);
        await db.query(`GRANT SELECT, INSERT ON hostel_db.complaint_logs TO '${dbUsername}'@'localhost'`);
        await db.query(`GRANT SELECT, INSERT ON hostel_db.notifications TO '${dbUsername}'@'localhost'`);
      } else if (role === 'admin') {
        await db.query(`GRANT ALL PRIVILEGES ON hostel_db.* TO '${dbUsername}'@'localhost' WITH GRANT OPTION`);
      }
      await db.query('FLUSH PRIVILEGES');
    } catch (dbErr) {
      console.warn('MySQL user creation warning:', dbErr.message);
    }

    return res.status(201).json({ success: true, message: 'User created successfully.', user_id: newUserId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PUT /api/admin/users/:id ─────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { full_name, email, role, phone, room_number, department, shift, password } = req.body;

    const [existing] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const updates = [];
    const params  = [];
    if (full_name)   { updates.push('full_name = ?');   params.push(full_name.trim()); }
    if (email)       { updates.push('email = ?');       params.push(email.toLowerCase().trim()); }
    if (role)        { updates.push('role = ?');        params.push(role); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone || null); }
    if (room_number !== undefined) { updates.push('room_number = ?'); params.push(room_number || null); }
    if (password)    {
      updates.push('password = ?');
      params.push(password);
    }

    if (updates.length) {
      params.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, params);
    }

    // Update staff profile
    if (role === 'staff' || existing[0].role === 'staff') {
      const [sp] = await db.query('SELECT staff_id FROM staff_profiles WHERE staff_id = ?', [userId]);
      if (sp.length) {
        if (department) await db.query('UPDATE staff_profiles SET department = ?, shift = ? WHERE staff_id = ?', [department, shift || 'morning', userId]);
      } else if (role === 'staff' && department) {
        await db.query('INSERT INTO staff_profiles (staff_id, department, shift) VALUES (?, ?, ?)', [userId, department, shift || 'morning']);
      }
    }

    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (parseInt(userId) === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    // Drop MySQL DB user
    try {
      const dbUsername = `${rows[0].role}_user_${userId}`;
      await db.query(`DROP USER IF EXISTS '${dbUsername}'@'localhost'`);
      await db.query('FLUSH PRIVILEGES');
    } catch (dbErr) {
      console.warn('MySQL user drop warning:', dbErr.message);
    }

    await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/admin/users/:id/toggle ───────────────────────
const toggleUserActive = async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.query('SELECT is_active FROM users WHERE user_id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = !rows[0].is_active;
    await db.query('UPDATE users SET is_active = ? WHERE user_id = ?', [newStatus, userId]);

    return res.json({ success: true, message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.`, is_active: newStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.*, sp.department, sp.shift
      FROM users u
      LEFT JOIN staff_profiles sp ON u.user_id = sp.staff_id
      WHERE u.user_id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = rows[0];
    delete user.password_hash;
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/staff ─────────────────────────────────────
const getStaffList = async (req, res) => {
  try {
    const [staff] = await db.query(`
      SELECT u.user_id, u.full_name, u.email, sp.department, sp.shift,
             COUNT(c.complaint_id) AS assigned_count
      FROM users u
      LEFT JOIN staff_profiles sp ON u.user_id = sp.staff_id
      LEFT JOIN complaints c ON c.assigned_to = u.user_id AND c.status != 'resolved'
      WHERE u.role = 'staff' AND u.is_active = TRUE
      GROUP BY u.user_id
    `);
    return res.json({ success: true, staff });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/privileges ────────────────────────────────
const getPrivileges = async (req, res) => {
  try {
    const roleUsers = ['hostel_student', 'hostel_staff', 'hostel_admin'];
    const result = {};

    for (const user of roleUsers) {
      try {
        const [grants] = await db.query(`SHOW GRANTS FOR '${user}'@'localhost'`);
        result[user] = grants.map(g => Object.values(g)[0]);
      } catch {
        result[user] = ['User not found or no privileges'];
      }
    }

    return res.json({ success: true, privileges: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/admin/privileges/grant ────────────────────────
const grantPrivilege = async (req, res) => {
  try {
    const { db_user, privilege, table_name } = req.body;
    if (!db_user || !privilege || !table_name) {
      return res.status(400).json({ success: false, message: 'db_user, privilege, and table_name are required.' });
    }

    const allowedUsers = ['hostel_student', 'hostel_staff', 'hostel_admin'];
    const allowedPrivs = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    const allowedTables = ['users', 'complaints', 'complaint_logs', 'staff_profiles', 'notifications'];

    if (!allowedUsers.includes(db_user)) return res.status(400).json({ success: false, message: 'Invalid DB user.' });
    if (privilege !== 'ALL' && !allowedPrivs.includes(privilege.toUpperCase())) return res.status(400).json({ success: false, message: 'Invalid privilege.' });
    if (!allowedTables.includes(table_name) && table_name !== '*') return res.status(400).json({ success: false, message: 'Invalid table.' });

    const sql = `GRANT ${privilege.toUpperCase()} ON hostel_db.${table_name} TO '${db_user}'@'localhost'`;
    await db.query(sql);
    await db.query('FLUSH PRIVILEGES');

    return res.json({ success: true, message: `Granted ${privilege} on ${table_name} to ${db_user}.`, executed_sql: sql });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

// ─── POST /api/admin/privileges/revoke ───────────────────────
const revokePrivilege = async (req, res) => {
  try {
    const { db_user, privilege, table_name } = req.body;
    if (!db_user || !privilege || !table_name) {
      return res.status(400).json({ success: false, message: 'db_user, privilege, and table_name are required.' });
    }

    const sql = `REVOKE ${privilege.toUpperCase()} ON hostel_db.${table_name} FROM '${db_user}'@'localhost'`;
    await db.query(sql);
    await db.query('FLUSH PRIVILEGES');

    return res.json({ success: true, message: `Revoked ${privilege} on ${table_name} from ${db_user}.`, executed_sql: sql });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

// ─── GET /api/admin/reports/stats ────────────────────────────
const getReportStats = async (req, res) => {
  try {
    const [stats] = await db.query('SELECT * FROM complaint_stats_view');
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/reports/pending ──────────────────────────
const getReportPending = async (req, res) => {
  try {
    const [pending] = await db.query('SELECT * FROM pending_complaints_view');
    return res.json({ success: true, pending });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/reports/export?type=stats|pending ────────
const exportCSV = async (req, res) => {
  try {
    const type = req.query.type || 'stats';
    let rows, filename, headers;

    if (type === 'pending') {
      [rows]   = await db.query('SELECT * FROM pending_complaints_view');
      filename = 'pending_complaints.csv';
      headers  = ['complaint_id','student_name','room_number','student_email','category','title','priority','status','created_at'];
    } else {
      [rows]   = await db.query('SELECT * FROM complaint_stats_view');
      filename = 'complaint_stats.csv';
      headers  = ['category','total','pending','in_progress','resolved','rejected'];
    }

    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DATABASE CLONING HELPER ──────────────────────────────────
const cloneDatabase = async (fromDb, toDb) => {
  const timestamp = new Date().getTime();
  const dumpFile = path.join(__dirname, '..', `clone-${fromDb}-${timestamp}.sql`);
  
  await mysqldump({
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: fromDb,
    },
    dumpToFile: dumpFile,
    dump: {
      schema: {
        table: {
          dropIfExist: true
        }
      }
    }
  });

  const sqlScript = fs.readFileSync(dumpFile, 'utf8');

  const toConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: toDb,
    multipleStatements: true,
    timezone: '+00:00'
  });

  await toConn.query(sqlScript);
  await toConn.end();

  if (fs.existsSync(dumpFile)) {
    fs.unlinkSync(dumpFile);
  }
};

// ─── POST /api/admin/backup ───────────────────────────────────
const backupDatabase = async (req, res) => {
  try {
    const mainDb = process.env.DB_NAME || 'hostel_db';
    const backupDb = db.backupDbName || `${mainDb}_backup`;
    
    await cloneDatabase(mainDb, backupDb);

    return res.json({ success: true, message: 'Database manual backup synchronization complete!' });
  } catch (err) {
    console.error('Backup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to synchronize backup database.' });
  }
};

// ─── POST /api/admin/restore ──────────────────────────────────
const restoreDatabase = async (req, res) => {
  try {
    const mainDb = process.env.DB_NAME || 'hostel_db';
    const backupDb = db.backupDbName || `${mainDb}_backup`;
    
    await cloneDatabase(backupDb, mainDb);

    return res.json({ success: true, message: 'Main database completely restored from backup database!' });
  } catch (err) {
    console.error('Restore error:', err);
    return res.status(500).json({ success: false, message: 'Failed to restore database from backup.' });
  }
};

module.exports = {
  getDashboard, getAllComplaints, getAdminComplaintDetail, updateComplaint,
  getAllUsers, createUser, updateUser, deleteUser, toggleUserActive, getUserById, getStaffList,
  getPrivileges, grantPrivilege, revokePrivilege,
  getReportStats, getReportPending, exportCSV,
  backupDatabase, restoreDatabase
};
