const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, default: Date.now },
  taskCompleted: { type: String, required: true },
  taskRemaining: { type: String, required: true },
  fileUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
