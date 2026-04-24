const Employee = require('../models/Employee');
const Project = require('../models/Project');
const EmployeeProject = require('../models/EmployeeProject');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Department = require('../models/Department');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalEmployees, activeEmployees, totalProjects, activeProjects, pendingLeaves] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'Active' }),
      Leave.countDocuments({ status: 'Pending' }),
    ]);

    // Employee growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const employeeGrowth = await Employee.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Project by status
    const projectDistribution = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Department distribution
    const departmentStats = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
    ]);

    // Active employees on projects — exclude orphaned records where employee was deleted
    const activeOnProjectsRaw = await EmployeeProject.find({ isActive: true })
      .populate('employee', 'firstName lastName employeeId profileImage designation')
      .populate('project', 'name status');

    // Filter out any stale records where the employee no longer exists
    const activeOnProjects = activeOnProjectsRaw.filter(ep => ep.employee != null);

    res.json({
      success: true,
      data: {
        stats: { totalEmployees, activeEmployees, totalProjects, activeProjects, pendingLeaves },
        employeeGrowth,
        projectDistribution,
        departmentStats,
        activeOnProjects: activeOnProjects.slice(0, 10),
      },
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/notifications
const Notification = require('../models/Notification');
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
};

// PUT /api/dashboard/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// PUT /api/dashboard/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};
