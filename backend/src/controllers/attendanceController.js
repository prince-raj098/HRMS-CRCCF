const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// GET /api/attendance
exports.getAttendance = async (req, res, next) => {
  try {
    const { employeeId, month, year, page = 1, limit = 31 } = req.query;
    const query = {};
    if (employeeId) query.employee = employeeId;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: records, total });
  } catch (err) { next(err); }
};

// POST /api/attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { employee, date, checkIn, checkOut, status, notes } = req.body;
    const checkInTime = checkIn ? new Date(checkIn) : null;
    const checkOutTime = checkOut ? new Date(checkOut) : null;
    let workHours = 0;
    if (checkInTime && checkOutTime) {
      workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    }
    const record = await Attendance.findOneAndUpdate(
      { employee, date: new Date(date) },
      { employee, date: new Date(date), checkIn: checkInTime, checkOut: checkOutTime, status, notes, workHours, markedBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

// GET /api/attendance/summary/:employeeId
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const records = await Attendance.find({ employee: req.params.employeeId, date: { $gte: start, $lte: end } });
    const summary = {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      halfDay: records.filter(r => r.status === 'Half Day').length,
      onLeave: records.filter(r => r.status === 'On Leave').length,
      wfh: records.filter(r => r.status === 'Work From Home').length,
      totalHours: records.reduce((acc, r) => acc + (r.workHours || 0), 0),
    };
    res.json({ success: true, data: { records, summary } });
  } catch (err) { next(err); }
};

// GET /api/leaves
exports.getLeaves = async (req, res, next) => {
  try {
    const { status, employeeId, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    if (req.user.role === 'employee') query.employee = req.user.employee._id;

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: leaves, total });
  } catch (err) { next(err); }
};

// POST /api/leaves
exports.applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const empId = req.user.role === 'employee' ? req.user.employee._id : req.body.employee;
    const leave = await Leave.create({ employee: empId, leaveType, startDate: start, endDate: end, totalDays, reason });
    res.status(201).json({ success: true, data: leave });
  } catch (err) { next(err); }
};

// PUT /api/leaves/:id/approve
exports.approveLeave = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('employee', 'firstName lastName employeeId');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    res.json({ success: true, data: leave });
  } catch (err) { next(err); }
};
