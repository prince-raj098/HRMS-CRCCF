const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true, default: 0 },
  hra: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  daysWorked: { type: Number, default: 0 },
  daysAbsent: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Processed', 'Paid'], default: 'Draft' },
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['Bank Transfer', 'Cash', 'Cheque'], default: 'Bank Transfer' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pdfPath: { type: String },
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
