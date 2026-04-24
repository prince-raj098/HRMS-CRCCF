const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { protect, hrAdmin } = require('../middleware/auth');

router.use(protect);
router.get('/attendance', ctrl.getAttendance);
router.post('/attendance', hrAdmin, ctrl.markAttendance);
router.get('/attendance/summary/:employeeId', ctrl.getAttendanceSummary);
router.get('/leaves', ctrl.getLeaves);
router.post('/leaves', ctrl.applyLeave);
router.put('/leaves/:id/approve', hrAdmin, ctrl.approveLeave);

module.exports = router;
