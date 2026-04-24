require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Department = require('./src/models/Department');
const Project = require('./src/models/Project');
const EmployeeProject = require('./src/models/EmployeeProject');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Department.deleteMany({}),
      Project.deleteMany({}),
      EmployeeProject.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create HR Admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'Admin@123',
      role: 'hr_admin',
      isFirstLogin: false,
    });
    console.log('HR Admin created: username=admin, password=Admin@123');

    // Create Departments
    const departments = await Department.insertMany([
      { name: 'Engineering', code: 'ENG', description: 'Software Development & Engineering' },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Management' },
      { name: 'Marketing', code: 'MKT', description: 'Marketing & Communications' },
      { name: 'Finance', code: 'FIN', description: 'Accounts & Finance' },
      { name: 'Operations', code: 'OPS', description: 'Business Operations' },
    ]);
    console.log(`${departments.length} departments created`);

    // Create sample employees
    const empData = [
      { firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@crccf.org', dateOfBirth: new Date('1992-03-15'), joiningDate: new Date('2022-01-10'), department: departments[0]._id, designation: 'Senior Developer', employmentType: 'Full-time', salary: { basic: 60000, hra: 15000, allowances: 5000 } },
      { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@crccf.org', dateOfBirth: new Date('1995-07-22'), joiningDate: new Date('2022-03-01'), department: departments[1]._id, designation: 'HR Executive', employmentType: 'Full-time', salary: { basic: 45000, hra: 11000, allowances: 3000 } },
      { firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@crccf.org', dateOfBirth: new Date('1990-11-08'), joiningDate: new Date('2021-06-15'), department: departments[0]._id, designation: 'Lead Engineer', employmentType: 'Full-time', salary: { basic: 80000, hra: 20000, allowances: 8000 } },
      { firstName: 'Sneha', lastName: 'Patel', email: 'sneha.patel@crccf.org', dateOfBirth: new Date('1994-04-30'), joiningDate: new Date('2023-02-01'), department: departments[2]._id, designation: 'Marketing Manager', employmentType: 'Full-time', salary: { basic: 55000, hra: 13000, allowances: 4000 } },
      { firstName: 'Vikram', lastName: 'Mehta', email: 'vikram.mehta@crccf.org', dateOfBirth: new Date('1988-09-12'), joiningDate: new Date('2020-08-01'), department: departments[3]._id, designation: 'Finance Head', employmentType: 'Full-time', salary: { basic: 90000, hra: 22000, allowances: 10000 } },
    ];

    const employees = [];
    for (let i = 0; i < empData.length; i++) {
      const data = empData[i];
      const empId = `EMP${String(i + 1).padStart(4, '0')}`;
      const dob = new Date(data.dateOfBirth);
      const mm = String(dob.getMonth() + 1).padStart(2, '0');
      const dd = String(dob.getDate()).padStart(2, '0');
      const defaultPassword = `${data.firstName.toLowerCase()}${mm}${dd}`;

      const emp = await Employee.create({ ...data, employeeId: empId });
      const user = await User.create({
        username: empId,
        password: defaultPassword,
        role: 'employee',
        employee: emp._id,
        employeeId: empId,
        isFirstLogin: true,
      });
      emp.user = user._id;
      await emp.save();
      employees.push(emp);
      console.log(`Employee: ${empId} | Password: ${defaultPassword}`);
    }

    // Create Projects
    const projects = await Project.insertMany([
      { projectId: 'PRJ0001', name: 'HRMS Platform', description: 'Internal HR management system development', status: 'Active', priority: 'High', startDate: new Date('2024-01-01'), givenTime: 180, expectedCompletionDate: new Date('2024-06-30'), budget: 500000, department: departments[0]._id, manager: employees[2]._id },
      { projectId: 'PRJ0002', name: 'Website Redesign', description: 'Complete website overhaul with modern design', status: 'Active', priority: 'Medium', startDate: new Date('2024-02-01'), givenTime: 90, expectedCompletionDate: new Date('2024-05-01'), budget: 200000, department: departments[2]._id, manager: employees[3]._id },
      { projectId: 'PRJ0003', name: 'Finance Automation', description: 'Automate financial reporting workflows', status: 'Planning', priority: 'High', startDate: new Date('2024-04-01'), givenTime: 120, expectedCompletionDate: new Date('2024-08-01'), budget: 300000, department: departments[3]._id, manager: employees[4]._id },
    ]);
    console.log(`${projects.length} projects created`);

    // Assign employees to projects
    await EmployeeProject.insertMany([
      { employee: employees[0]._id, project: projects[0]._id, role: 'Backend Developer', hoursAllocated: 800, isActive: true },
      { employee: employees[2]._id, project: projects[0]._id, role: 'Project Lead', hoursAllocated: 1000, isActive: true },
      { employee: employees[3]._id, project: projects[1]._id, role: 'Project Manager', hoursAllocated: 600, isActive: true },
      { employee: employees[0]._id, project: projects[1]._id, role: 'Frontend Developer', hoursAllocated: 400, isActive: true },
      { employee: employees[4]._id, project: projects[2]._id, role: 'Finance Lead', hoursAllocated: 700, isActive: true },
    ]);
    console.log('Project assignments created');

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HR Admin: username=admin | password=Admin@123');
    console.log('Employee: username=EMP0001 | password=rahul0315');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
