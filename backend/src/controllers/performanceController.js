const Performance = require('../models/Performance');

// GET /api/performance
exports.getReviews = async (req, res, next) => {
  try {
    const { employeeId, page = 1, limit = 10 } = req.query;
    const query = {};
    if (employeeId) query.employee = employeeId;
    if (req.user.role === 'employee') query.employee = req.user.employee._id;
    const total = await Performance.countDocuments(query);
    const reviews = await Performance.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: reviews, total });
  } catch (err) { next(err); }
};

// POST /api/performance
exports.createReview = async (req, res, next) => {
  try {
    const { ratings } = req.body;
    const ratingValues = Object.values(ratings).filter(v => v);
    const overallRating = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : 0;
    const review = await Performance.create({ ...req.body, overallRating });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// PUT /api/performance/:id
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};
