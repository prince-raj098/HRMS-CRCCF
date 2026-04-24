const Recruitment = require('../models/Recruitment');

// GET /api/recruitment
exports.getRecruitments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await Recruitment.countDocuments(query);
    const recruitments = await Recruitment.find(query)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: recruitments, total });
  } catch (err) { next(err); }
};

// GET /api/recruitment/:id
exports.getRecruitment = async (req, res, next) => {
  try {
    const r = await Recruitment.findById(req.params.id).populate('department', 'name');
    if (!r) return res.status(404).json({ success: false, message: 'Recruitment not found.' });
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

// POST /api/recruitment
exports.createRecruitment = async (req, res, next) => {
  try {
    const r = await Recruitment.create({
      ...req.body,
      image: req.file ? req.file.filename : undefined,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: r });
  } catch (err) { next(err); }
};

// PUT /api/recruitment/:id
exports.updateRecruitment = async (req, res, next) => {
  try {
    const r = await Recruitment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...(req.file && { image: req.file.filename }) },
      { new: true, runValidators: true }
    );
    if (!r) return res.status(404).json({ success: false, message: 'Recruitment not found.' });
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

// DELETE /api/recruitment/:id
exports.deleteRecruitment = async (req, res, next) => {
  try {
    await Recruitment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Recruitment deleted.' });
  } catch (err) { next(err); }
};
