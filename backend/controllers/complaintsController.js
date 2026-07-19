const db     = require('../db/db');

// ─── STUDENT: GET /api/student/dashboard ─────────────────────────
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.user_id;

    const [counts] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'pending')     AS pending,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved')    AS resolved,
        SUM(status = 'rejected')    AS rejected
      FROM complaints WHERE student_id = ?
    `, [studentId]);

    const [recent] = await db.query(`
      SELECT complaint_id, category, title, priority, status, created_at
      FROM complaints
      WHERE student_id = ?
      ORDER BY created_at DESC LIMIT 5
    `, [studentId]);

    return res.json({ success: true, stats: counts[0], recent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STUDENT: GET /api/student/complaints ────────────────────────
const getMyComplaints = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { status, category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE c.student_id = ?';
    const params = [studentId];

    if (status)   { where += ' AND c.status = ?';   params.push(status);   }
    if (category) { where += ' AND c.category = ?'; params.push(category); }

    const [complaints] = await db.query(`
      SELECT c.complaint_id, c.category, c.title, c.priority, c.status,
             c.created_at, c.updated_at,
             u.full_name AS assigned_staff
      FROM complaints c
      LEFT JOIN users u ON c.assigned_to = u.user_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`SELECT COUNT(*) AS total FROM complaints c ${where}`, params);

    return res.json({
      success: true,
      complaints,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STUDENT: POST /api/student/complaints ───────────────────────
const raiseComplaint = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { category, title, description, priority } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Category, title, and description are required.' });
    }

    const [result] = await db.query(`
      INSERT INTO complaints (student_id, category, title, description, priority)
      VALUES (?, ?, ?, ?, ?)
    `, [studentId, category, title.trim(), description.trim(), priority || 'medium']);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint_id: result.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STUDENT: GET /api/student/complaints/:id ────────────────────
const getComplaintDetail = async (req, res) => {
  try {
    const studentId   = req.user.user_id;
    const complaintId = req.params.id;

    const [rows] = await db.query(`
      SELECT c.*, u.full_name AS student_name, u.room_number, u.email AS student_email,
             s.full_name AS staff_name
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      LEFT JOIN users s ON c.assigned_to = s.user_id
      WHERE c.complaint_id = ? AND c.student_id = ?
    `, [complaintId, studentId]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const [logs] = await db.query(`
      SELECT cl.*, u.full_name AS changed_by_name, u.role AS changed_by_role
      FROM complaint_logs cl
      JOIN users u ON cl.changed_by = u.user_id
      WHERE cl.complaint_id = ?
      ORDER BY cl.changed_at ASC
    `, [complaintId]);

    return res.json({ success: true, complaint: rows[0], logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STUDENT: GET /api/student/profile ───────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, role, room_number, phone, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STUDENT: PUT /api/student/profile ───────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { phone, room_number, current_password, new_password } = req.body;
    const userId = req.user.user_id;

    // Update basic info
    await db.query(
      'UPDATE users SET phone = ?, room_number = ? WHERE user_id = ?',
      [phone || null, room_number || null, userId]
    );

    // Optional password change
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      const [rows] = await db.query('SELECT password FROM users WHERE user_id = ?', [userId]);
      const valid  = (current_password === rows[0].password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }
      await db.query('UPDATE users SET password = ? WHERE user_id = ?', [new_password, userId]);
    }

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STAFF: GET /api/staff/dashboard ─────────────────────────────
const getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user.user_id;

    const [counts] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'pending')     AS pending,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved')    AS resolved,
        SUM(status = 'rejected')    AS rejected,
        SUM(DATE(updated_at) = CURDATE() AND status = 'resolved') AS resolved_today
      FROM complaints WHERE assigned_to = ?
    `, [staffId]);

    const [recent] = await db.query(`
      SELECT c.complaint_id, c.category, c.title, c.priority, c.status,
             u.full_name AS student_name, u.room_number, c.created_at
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      WHERE c.assigned_to = ?
      ORDER BY FIELD(c.priority,'high','medium','low'), c.created_at DESC
      LIMIT 5
    `, [staffId]);

    const [profile] = await db.query(`
      SELECT u.full_name, u.email, u.phone, sp.department, sp.shift
      FROM users u
      LEFT JOIN staff_profiles sp ON u.user_id = sp.staff_id
      WHERE u.user_id = ?
    `, [staffId]);

    return res.json({ success: true, stats: counts[0], recent, profile: profile[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STAFF: GET /api/staff/complaints ────────────────────────────
const getAssignedComplaints = async (req, res) => {
  try {
    const staffId = req.user.user_id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE c.assigned_to = ?';
    const params = [staffId];
    if (status) { where += ' AND c.status = ?'; params.push(status); }

    const [complaints] = await db.query(`
      SELECT c.complaint_id, c.category, c.title, c.priority, c.status,
             c.created_at, c.updated_at, u.full_name AS student_name, u.room_number
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      ${where}
      ORDER BY FIELD(c.priority,'high','medium','low'), c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`SELECT COUNT(*) AS total FROM complaints c ${where}`, params);

    return res.json({
      success: true, complaints,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STAFF: GET /api/staff/complaints/:id ─────────────────────────
const getStaffComplaintDetail = async (req, res) => {
  try {
    const staffId     = req.user.user_id;
    const complaintId = req.params.id;

    const [rows] = await db.query(`
      SELECT c.*, u.full_name AS student_name, u.room_number, u.email AS student_email, u.phone AS student_phone
      FROM complaints c
      JOIN users u ON c.student_id = u.user_id
      WHERE c.complaint_id = ? AND c.assigned_to = ?
    `, [complaintId, staffId]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Complaint not found or not assigned to you.' });
    }

    const [logs] = await db.query(`
      SELECT cl.*, u.full_name AS changed_by_name
      FROM complaint_logs cl
      JOIN users u ON cl.changed_by = u.user_id
      WHERE cl.complaint_id = ?
      ORDER BY cl.changed_at ASC
    `, [complaintId]);

    return res.json({ success: true, complaint: rows[0], logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── STAFF: PUT /api/staff/complaints/:id/status ──────────────────
const updateComplaintStatus = async (req, res) => {
  try {
    const staffId     = req.user.user_id;
    const complaintId = req.params.id;
    const { new_status, remark } = req.body;

    if (!new_status) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }
    if (!remark || remark.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A remark is required when updating status.' });
    }

    // Verify complaint is assigned to this staff
    const [rows] = await db.query(
      'SELECT complaint_id, status FROM complaints WHERE complaint_id = ? AND assigned_to = ?',
      [complaintId, staffId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Complaint not found or not assigned to you.' });
    }

    const old_status = rows[0].status;

    // Update status (this will also fire the trigger, but we insert our own log with the remark)
    // Temporarily disable trigger effect by using a direct log insert with remark
    await db.query(
      'UPDATE complaints SET status = ? WHERE complaint_id = ?',
      [new_status, complaintId]
    );

    // Insert log with staff remark (overrides the trigger's generic log)
    await db.query(
      'INSERT INTO complaint_logs (complaint_id, changed_by, old_status, new_status, remark) VALUES (?, ?, ?, ?, ?)',
      [complaintId, staffId, old_status, new_status, remark.trim()]
    );

    // Notify the student
    const [complaint] = await db.query(
      'SELECT student_id, title FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );
    if (complaint.length) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [complaint[0].student_id, `Your complaint "${complaint[0].title}" status has been updated to: ${new_status.replace('_', ' ')}.`]
      );
    }

    return res.json({ success: true, message: 'Complaint status updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getStudentDashboard,
  getMyComplaints,
  raiseComplaint,
  getComplaintDetail,
  getProfile,
  updateProfile,
  getStaffDashboard,
  getAssignedComplaints,
  getStaffComplaintDetail,
  updateComplaintStatus
};
