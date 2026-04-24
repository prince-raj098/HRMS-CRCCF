const DailyReport = require('../models/DailyReport');
const Project = require('../models/Project');

// GET /api/reports/daily
exports.getReports = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.project) query.project = req.query.project;

    const reports = await DailyReport.find(query)
      .populate('employee', 'firstName lastName employeeId profileImage')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/daily/my-reports
exports.getMyReports = async (req, res, next) => {
  try {
    const reports = await DailyReport.find({ employee: req.user.employee })
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
};

// POST /api/reports/daily
exports.createReport = async (req, res, next) => {
  try {
    const { project, date, taskCompleted, taskRemaining } = req.body;
    let fileUrl;
    if (req.file) {
      fileUrl = req.file.filename;
    }

    const report = await DailyReport.create({
      employee: req.user.employee,
      project,
      date: date || Date.now(),
      taskCompleted,
      taskRemaining,
      fileUrl
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
