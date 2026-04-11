const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Personal', 'Contact', 'Document', 'Bank', 'Emergency Contact', 'Other'], required: true },
  field: { type: String, required: true },
  currentValue: { type: mongoose.Schema.Types.Mixed },
  requestedValue: { type: mongoose.Schema.Types.Mixed, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  attachments: [String],
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);
