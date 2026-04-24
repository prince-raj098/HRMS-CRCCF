const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/performanceController');
const { protect, hrAdmin } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getReviews);
router.post('/', hrAdmin, ctrl.createReview);
router.put('/:id', hrAdmin, ctrl.updateReview);

module.exports = router;
