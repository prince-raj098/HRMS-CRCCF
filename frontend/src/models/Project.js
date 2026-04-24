const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  client: { type: String },
  status: { type: String, enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'], default: 'Planning' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  startDate: { type: Date, required: true },
  givenTime: { type: Number, required: true, comment: 'In days - time allocated for project' },
  expectedCompletionDate: { type: Date, required: true },
  actualCompletionDate: { type: Date },
  budget: { type: Number, default: 0 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  tags: [String],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

projectSchema.virtual('assignedEmployees', {
  ref: 'EmployeeProject',
  localField: '_id',
  foreignField: 'project',
});

module.exports = mongoose.model('Project', projectSchema);
