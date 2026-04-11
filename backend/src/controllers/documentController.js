const Document = require('../models/Document');

// GET /api/documents
exports.getDocuments = async (req, res, next) => {
  try {
    const { employeeId, type, page = 1, limit = 10 } = req.query;
    const query = {};
    if (employeeId) query.employee = employeeId;
    if (type) query.type = type;
    if (req.user.role === 'employee') query.employee = req.user.employee._id;
    const total = await Document.countDocuments(query);
    const docs = await Document.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: docs, total });
  } catch (err) { next(err); }
};

// POST /api/documents
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const empId = req.user.role === 'employee' ? req.user.employee._id : req.body.employee;
    const doc = await Document.create({
      employee: empId,
      title: req.body.title,
      type: req.body.type,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      notes: req.body.notes,
      expiryDate: req.body.expiryDate,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// PUT /api/documents/:id/verify
exports.verifyDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verifiedBy: req.user._id },
      { new: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// DELETE /api/documents/:id
exports.deleteDocument = async (req, res, next) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) { next(err); }
};
