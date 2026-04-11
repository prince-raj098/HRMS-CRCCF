const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['ID Proof', 'Address Proof', 'Educational', 'Experience', 'Contract', 'Offer Letter', 'Payslip', 'Other'], required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiryDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
