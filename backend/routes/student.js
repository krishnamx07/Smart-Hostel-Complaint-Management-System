const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard      = require('../middleware/roleGuard');
const {
  getStudentDashboard, getMyComplaints, raiseComplaint,
  getComplaintDetail, getProfile, updateProfile
} = require('../controllers/complaintsController');

router.use(authMiddleware, roleGuard('student'));

router.get('/dashboard',          getStudentDashboard);
router.get('/complaints',         getMyComplaints);
router.post('/complaints',        raiseComplaint);
router.get('/complaints/:id',     getComplaintDetail);
router.get('/profile',            getProfile);
router.put('/profile',            updateProfile);

module.exports = router;
