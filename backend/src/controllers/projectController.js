const Project = require('../models/Project');
const EmployeeProject = require('../models/EmployeeProject');
const Employee = require('../models/Employee');

const generateProjectId = async () => {
  const count = await Project.countDocuments();
  return `PRJ${String(count + 1).padStart(4, '0')}`;
};

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { projectId: { $regex: search, $options: 'i' } },
    ];
    if (status) query.status = status;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('manager', 'firstName lastName employeeId')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: projects, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'firstName lastName employeeId profileImage')
      .populate('department', 'name');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const assignments = await EmployeeProject.find({ project: req.params.id, isActive: true })
      .populate('employee', 'firstName lastName employeeId profileImage designation department');

    res.json({ success: true, data: { ...project.toJSON(), assignments } });
  } catch (err) { next(err); }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const projectId = await generateProjectId();
    const project = await Project.create({ ...req.body, projectId });
    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    await EmployeeProject.deleteMany({ project: req.params.id });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/assign
exports.assignEmployee = async (req, res, next) => {
  try {
    const { employeeId, role, hoursAllocated } = req.body;
    const existing = await EmployeeProject.findOne({ employee: employeeId, project: req.params.id });
    if (existing) {
      existing.isActive = true;
      existing.role = role;
      existing.hoursAllocated = hoursAllocated;
      await existing.save();
      return res.json({ success: true, data: existing });
    }
    const assignment = await EmployeeProject.create({ employee: employeeId, project: req.params.id, role, hoursAllocated });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/assign/:empId
exports.removeEmployee = async (req, res, next) => {
  try {
    await EmployeeProject.findOneAndUpdate(
      { employee: req.params.empId, project: req.params.id },
      { isActive: false }
    );
    res.json({ success: true, message: 'Employee removed from project.' });
  } catch (err) { next(err); }
};

// GET /api/projects/my-projects
exports.getMyProjects = async (req, res, next) => {
  try {
    const assignments = await EmployeeProject.find({ employee: req.user.employee, isActive: true })
      .populate('project', 'name description status priority expectedCompletionDate projectId members')
      .populate('employee', 'firstName lastName employeeId profileImage designation department');
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
};

// GET /api/projects/active-employees - For Dashboard
exports.getActiveEmployeesOnProjects = async (req, res, next) => {
  try {
    const assignments = await EmployeeProject.find({ isActive: true })
      .populate('employee', 'firstName lastName employeeId profileImage designation')
      .populate('project', 'name status priority expectedCompletionDate');
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
};
