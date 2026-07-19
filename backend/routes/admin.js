const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard      = require('../middleware/roleGuard');
const {
  getDashboard, getAllComplaints, getAdminComplaintDetail, updateComplaint,
  getAllUsers, createUser, updateUser, deleteUser, toggleUserActive, getUserById, getStaffList,
  getPrivileges, grantPrivilege, revokePrivilege,
  getReportStats, getReportPending, exportCSV,
  backupDatabase, restoreDatabase
} = require('../controllers/adminController');

router.use(authMiddleware, roleGuard('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Complaints
router.get('/complaints',          getAllComplaints);
router.get('/complaints/:id',      getAdminComplaintDetail);
router.put('/complaints/:id',      updateComplaint);

// Users
router.get('/users',               getAllUsers);
router.get('/users/staff-list',    getStaffList);
router.get('/users/:id',           getUserById);
router.post('/users',              createUser);
router.put('/users/:id',           updateUser);
router.delete('/users/:id',        deleteUser);
router.patch('/users/:id/toggle',  toggleUserActive);

// Privilege Manager
router.get('/privileges',          getPrivileges);
router.post('/privileges/grant',   grantPrivilege);
router.post('/privileges/revoke',  revokePrivilege);

// Reports
router.get('/reports/stats',       getReportStats);
router.get('/reports/pending',     getReportPending);
router.get('/reports/export',      exportCSV);

// Database Maintenance
router.post('/backup',             backupDatabase);
router.post('/restore',            restoreDatabase);

module.exports = router;
