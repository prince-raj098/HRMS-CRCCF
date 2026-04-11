const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recruitmentController');
const { protect, hrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getRecruitments);
router.get('/:id', ctrl.getRecruitment);
router.post('/', hrAdmin, upload.single('image'), ctrl.createRecruitment);
router.put('/:id', hrAdmin, upload.single('image'), ctrl.updateRecruitment);
router.delete('/:id', hrAdmin, ctrl.deleteRecruitment);

module.exports = router;
