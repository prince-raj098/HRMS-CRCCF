const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/changeRequestController');
const { protect, hrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getRequests);
router.post('/', upload.array('attachments', 5), ctrl.createRequest);
router.put('/:id/review', hrAdmin, ctrl.reviewRequest);

module.exports = router;
