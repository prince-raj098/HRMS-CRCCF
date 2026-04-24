require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'HRMS API is running', time: new Date() }));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/employees', require('./src/routes/employees'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api', require('./src/routes/attendance'));
app.use('/api/payroll', require('./src/routes/payroll'));
app.use('/api/change-requests', require('./src/routes/changeRequests'));
app.use('/api/recruitment', require('./src/routes/recruitment'));
app.use('/api/performance', require('./src/routes/performance'));
app.use('/api/documents', require('./src/routes/documents'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/departments', require('./src/routes/departments'));
app.use('/api/reports/daily', require('./src/routes/dailyReports'));
app.use('/api/email', require('./src/routes/email'));

// Error handling
app.use(notFound);
app.use(errorHandler);

// Connect DB & Start
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 HRMS API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
