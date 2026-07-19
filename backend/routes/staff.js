const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard      = require('../middleware/roleGuard');
const {
  getStaffDashboard, getAssignedComplaints, getStaffComplaintDetail,
  updateComplaintStatus, getProfile
} = require('../controllers/complaintsController');

router.use(authMiddleware, roleGuard('staff'));

router.get('/dashboard',                getStaffDashboard);
router.get('/complaints',               getAssignedComplaints);
router.get('/complaints/:id',           getStaffComplaintDetail);
router.put('/complaints/:id/status',    updateComplaintStatus);
router.get('/profile',                  getProfile);

module.exports = router;
