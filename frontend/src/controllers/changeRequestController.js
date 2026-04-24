const ChangeRequest = require('../models/ChangeRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

// GET /api/change-requests
exports.getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (req.user.role === 'employee') query.employee = req.user.employee._id;

    const total = await ChangeRequest.countDocuments(query);
    const requests = await ChangeRequest.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('requestedBy', 'username')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: requests, total });
  } catch (err) { next(err); }
};

// POST /api/change-requests
exports.createRequest = async (req, res, next) => {
  try {
    const { type, field, requestedValue, reason } = req.body;
    const employeeId = req.user.employee._id;
    const employee = await Employee.findById(employeeId);

    const currentValue = field.split('.').reduce((obj, key) => obj?.[key], employee);

    const request = await ChangeRequest.create({
      employee: employeeId,
      requestedBy: req.user._id,
      type, field,
      currentValue,
      requestedValue,
      reason,
      attachments: req.files ? req.files.map(f => f.filename) : [],
    });

    // Notify HR admins
    const User = require('../models/User');
    const hrAdmins = await User.find({ role: 'hr_admin' });
    await Promise.all(hrAdmins.map(hr => Notification.create({
      recipient: hr._id,
      title: 'New Profile Change Request',
      message: `${employee.firstName} ${employee.lastName} has requested a change to ${field}.`,
      type: 'info',
      category: 'change_request',
      link: `/admin/change-requests`,
    })));

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// PUT /api/change-requests/:id/review
exports.reviewRequest = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const request = await ChangeRequest.findById(req.params.id).populate('employee');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (rejectionReason) request.rejectionReason = rejectionReason;

    if (status === 'Approved') {
      const keys = request.field.split('.');
      const employee = await Employee.findById(request.employee._id);
      if (keys.length === 1) {
        employee[keys[0]] = request.requestedValue;
      } else if (keys.length === 2) {
        if (!employee[keys[0]]) employee[keys[0]] = {};
        employee[keys[0]][keys[1]] = request.requestedValue;
        employee.markModified(keys[0]);
      }
      await employee.save();
    }

    await request.save();

    // Notify employee
    await Notification.create({
      recipient: request.requestedBy,
      title: `Change Request ${status}`,
      message: `Your request to change ${request.field} has been ${status.toLowerCase()}.`,
      type: status === 'Approved' ? 'success' : 'error',
      category: 'change_request',
    });

    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};
