const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  ratings: {
    productivity: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    leadership: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
  },
  overallRating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  goals: [{ title: String, achieved: Boolean, notes: String }],
  kpis: [{ metric: String, target: Number, achieved: Number, unit: String }],
  status: { type: String, enum: ['Draft', 'Submitted', 'Acknowledged'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Performance', performanceSchema);
