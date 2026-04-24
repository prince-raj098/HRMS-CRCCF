const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relationship: String,
  phone: String,
});

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'India' },
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: String },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
  joiningDate: { type: Date, required: true },
  exitDate: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave', 'Terminated'], default: 'Active' },
  salary: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String,
  },
  profileImage: { type: String },
  emergencyContact: emergencyContactSchema,
  skills: [String],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Employee', employeeSchema);
