const mongoose = require('mongoose');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/hrms').then(async () => {
  const users = await User.find({}).populate('employee');
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    if (u.employee) {
      const emp = u.employee;
      const d = new Date(emp.dateOfBirth);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const generatedPass = `${emp.firstName.toLowerCase()}${mm}${dd}`;
      const isMatch = await bcrypt.compare(generatedPass, u.password);
      console.log(`User: ${u.username}, Employee: ${emp.firstName}, DOB: ${emp.dateOfBirth}, GenPass: ${generatedPass}, Match: ${isMatch}`);
    } else {
      console.log(`User: ${u.username} has no employee ref. pass: ${u.password}`);
    }
  }
  process.exit(0);
});
