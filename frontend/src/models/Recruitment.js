const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  googleFormLink: { type: String, required: true },
  image: { type: String },
  lastDate: { type: Date, required: true },
  publishDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Active', 'Expired', 'Closed'], default: 'Draft' },
  openings: { type: Number, default: 1 },
  location: { type: String },
  salaryRange: { from: Number, to: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Recruitment', recruitmentSchema);
