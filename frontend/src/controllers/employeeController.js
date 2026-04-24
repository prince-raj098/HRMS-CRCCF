const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const EmployeeProject = require('../models/EmployeeProject');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const { format } = require('date-fns');

const generateEmployeeId = async () => {
  let count = await Employee.countDocuments();
  let id;
  let exists = true;
  while (exists) {
    id = `EMP${String(count + 1).padStart(4, '0')}`;
    exists = await Employee.findOne({ employeeId: id });
    if (exists) count++;
  }
  return id;
};

const generateDefaultPassword = (firstName, dob) => {
  const d = new Date(dob);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${firstName.replace(/[ \t\r\n]+/g, '').toLowerCase()}${mm}${dd}`;
};

// GET /api/employees
exports.getEmps = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department, status } = req.query;
    const query = {};
    if (search) query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (department) query.department = department;
    if (status) query.status = status;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('department', 'name code')
      .populate('user', 'username lastLogin isFirstLogin')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: employees, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// GET /api/employees/:id
exports.getEmp = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name code')
      .populate('user', 'username lastLogin isFirstLogin role');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
};

// POST /api/employees
exports.createEmp = async (req, res, next) => {
  try {
    const { firstName, lastName, email, dateOfBirth, joiningDate, department, designation, employmentType, salary, phone } = req.body;
    const employeeId = await generateEmployeeId();
    const defaultPassword = generateDefaultPassword(firstName, dateOfBirth);

    const employee = await Employee.create({
      employeeId, firstName, lastName, email, dateOfBirth, joiningDate,
      department, designation, employmentType, salary, phone,
      profileImage: req.file ? req.file.filename : undefined,
    });

    const user = await User.create({
      username: employeeId,
      password: defaultPassword,
      role: 'employee',
      employee: employee._id,
      employeeId,
      isFirstLogin: true,
    });

    employee.user = user._id;
    await employee.save();

    res.status(201).json({
      success: true,
      data: employee,
      credentials: { username: employeeId, defaultPassword },
    });
  } catch (err) { next(err); }
};

// PUT /api/employees/:id
exports.updateEmp = async (req, res, next) => {
  try {
    const { employeeId, ...rest } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    // If HR is changing employeeId
    if (employeeId && employeeId !== employee.employeeId) {
      const exists = await Employee.findOne({ employeeId });
      if (exists) return res.status(400).json({ success: false, message: 'Employee ID already in use.' });
      employee.employeeId = employeeId;
      await User.findByIdAndUpdate(employee.user, { username: employeeId, employeeId });
    }

    Object.assign(employee, rest);
    if (req.file) employee.profileImage = req.file.filename;
    await employee.save();

    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
};

// DELETE /api/employees/:id
exports.deleteEmp = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    if (employee.user) {
      await User.findByIdAndDelete(employee.user);
    }
    // Cascade-delete all related records so no orphaned rows appear anywhere
    await Promise.all([
      EmployeeProject.deleteMany({ employee: employee._id }),
      Leave.deleteMany({ employee: employee._id }),
      Attendance.deleteMany({ employee: employee._id }),
      Payroll.deleteMany({ employee: employee._id }),
    ]);
    await employee.deleteOne();
    res.json({ success: true, message: 'Employee deleted.' });
  } catch (err) { next(err); }
};

// POST /api/employees/:id/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    
    let newPassword = req.body.password || generateDefaultPassword(employee.firstName, employee.dateOfBirth);
    let user = null;

    if (employee.user) {
      user = await User.findById(employee.user);
    } else {
      // Look up by employee reference just in case
      user = await User.findOne({ employee: employee._id });
    }

    if (!user) {
      // Re-create the user if they were completely missing
      user = await User.create({
        username: employee.employeeId,
        password: newPassword,
        role: 'employee',
        employee: employee._id,
        employeeId: employee.employeeId,
        isFirstLogin: true,
      });
      employee.user = user._id;
      await employee.save();
    } else {
      user.password = newPassword;
      user.isFirstLogin = true;
      await user.save();
    }

    res.json({ success: true, message: 'Password reset successfully.', newPassword });
  } catch (err) { next(err); }
};
