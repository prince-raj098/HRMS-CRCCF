const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', ctrl.getDashboardStats);
router.get('/notifications', ctrl.getNotifications);
router.put('/notifications/:id/read', ctrl.markRead);
router.put('/notifications/read-all', ctrl.markAllRead);

module.exports = router;
