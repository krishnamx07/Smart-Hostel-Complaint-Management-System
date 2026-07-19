const jwt    = require('jsonwebtoken');
const db     = require('../db/db');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    // Support both old (password_hash) and new (password) column names
    const dbPassword = user.password || user.password_hash;
    const passwordMatch = (password === dbPassword);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = {
      user_id:   user.user_id,
      role:      user.role,
      full_name: user.full_name,
      email:     user.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure:   false, // set true in production with HTTPS
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        user_id:     user.user_id,
        full_name:   user.full_name,
        email:       user.email,
        role:        user.role,
        room_number: user.room_number
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// POST /api/auth/register (student self-registration)
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, room_number } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check email exists
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, role, phone, room_number) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), password, 'student', phone || null, room_number || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.',
      user_id: result.insertId
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, role, room_number, phone, is_active, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, register, logout, getMe };
