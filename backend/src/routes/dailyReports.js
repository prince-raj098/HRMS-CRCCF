const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dailyReportController');
const { protect, hrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.post('/', upload.single('file'), ctrl.createReport);
router.get('/my-reports', ctrl.getMyReports);
router.get('/', hrAdmin, ctrl.getReports);

module.exports = router;
