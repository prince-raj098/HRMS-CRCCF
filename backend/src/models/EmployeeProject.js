const mongoose = require('mongoose');

const employeeProjectSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  role: { type: String, required: true },
  hoursAllocated: { type: Number, default: 0 },
  hoursLogged: { type: Number, default: 0 },
  assignedDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

employeeProjectSchema.index({ employee: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeProject', employeeProjectSchema);
