const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// GET /api/payroll
exports.getPayrolls = async (req, res, next) => {
  try {
    const { month, year, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (req.user.role === 'employee' && req.user.employee) {
      query.employee = req.user.employee._id;
    }

    const total = await Payroll.countDocuments(query);
    const payrollsRaw = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId department designation')
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter out stale records where the employee was deleted
    const payrolls = payrollsRaw.filter(p => p.employee != null);

    res.json({ success: true, data: payrolls, total });
  } catch (err) { next(err); }
};

// POST /api/payroll/generate
exports.generatePayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Please select an employee.' });
    const employee = await Employee.findById(employeeId).populate('department');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });

    const daysWorked = attendanceRecords.filter(r => ['Present', 'Work From Home'].includes(r.status)).length;
    const halfDays = attendanceRecords.filter(r => r.status === 'Half Day').length;
    const daysInMonth = end.getDate();
    const daysAbsent = daysInMonth - daysWorked - halfDays;

    const basic = employee.salary?.basic || 0;
    const hra = employee.salary?.hra || 0;
    const allowances = employee.salary?.allowances || 0;
    const grossSalary = basic + hra + allowances;

    const pf = basic * 0.12;
    const esi = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
    const tax = grossSalary > 50000 ? grossSalary * 0.1 : 0;
    const totalDeductions = pf + esi + tax + (employee.salary?.deductions || 0);
    const netSalary = grossSalary - totalDeductions;

    const payroll = await Payroll.findOneAndUpdate(
      { employee: employeeId, month: parseInt(month), year: parseInt(year) },
      {
        employee: employeeId, month: parseInt(month), year: parseInt(year),
        basicSalary: basic, hra, allowances, grossSalary,
        pf, esi, tax, totalDeductions, netSalary,
        daysWorked, daysAbsent, generatedBy: req.user._id, status: 'Processed',
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: payroll });
  } catch (err) { next(err); }
};

// PUT /api/payroll/:id/pay
exports.markAsPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: 'Paid', paymentDate: new Date(), paymentMethod: req.body.paymentMethod || 'Bank Transfer' },
      { new: true }
    );
    res.json({ success: true, data: payroll });
  } catch (err) { next(err); }
};

// GET /api/payroll/:id/pdf
exports.downloadPayslip = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId designation department bankDetails');
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payroll.employee.employeeId}_${payroll.month}_${payroll.year}.pdf`);
    doc.pipe(res);

    const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    doc.fontSize(24).fillColor('#1e40af').text('CRCCF HRMS', { align: 'center' });
    doc.fontSize(14).fillColor('#374151').text('PAYSLIP', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#6b7280').text(`${MONTHS[payroll.month]} ${payroll.year}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor('#111827');
    doc.text(`Employee: ${payroll.employee.firstName} ${payroll.employee.lastName}`);
    doc.text(`Employee ID: ${payroll.employee.employeeId}`);
    doc.text(`Designation: ${payroll.employee.designation || 'N/A'}`);
    doc.text(`Days Worked: ${payroll.daysWorked} | Days Absent: ${payroll.daysAbsent}`);
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#1e40af').text('Earnings', { underline: true });
    doc.fontSize(11).fillColor('#111827');
    doc.text(`Basic Salary:        ₹${payroll.basicSalary.toFixed(2)}`);
    doc.text(`HRA:                 ₹${payroll.hra.toFixed(2)}`);
    doc.text(`Allowances:          ₹${payroll.allowances.toFixed(2)}`);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#059669').text(`Gross Salary:        ₹${payroll.grossSalary.toFixed(2)}`);
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#dc2626').text('Deductions', { underline: true });
    doc.fontSize(11).fillColor('#111827');
    doc.text(`PF (12%):            ₹${payroll.pf.toFixed(2)}`);
    doc.text(`ESI:                 ₹${payroll.esi.toFixed(2)}`);
    doc.text(`Tax:                 ₹${payroll.tax.toFixed(2)}`);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#dc2626').text(`Total Deductions:    ₹${payroll.totalDeductions.toFixed(2)}`);
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1e40af').stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#1e40af').text(`Net Salary: ₹${payroll.netSalary.toFixed(2)}`, { bold: true });

    doc.end();
  } catch (err) { next(err); }
};
