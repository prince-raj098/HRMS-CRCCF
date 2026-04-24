const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['hr_admin', 'employee'], default: 'employee' },
  isFirstLogin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  lastLogin: { type: Date },
  passwordResetAt: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
