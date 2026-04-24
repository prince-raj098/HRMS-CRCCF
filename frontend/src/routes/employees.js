const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employeeController');
const { protect, hrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getEmps);
router.get('/:id', ctrl.getEmp);
router.post('/', hrAdmin, upload.single('profileImage'), ctrl.createEmp);
router.put('/:id', hrAdmin, upload.single('profileImage'), ctrl.updateEmp);
router.delete('/:id', hrAdmin, ctrl.deleteEmp);
router.post('/:id/reset-password', hrAdmin, ctrl.resetPassword);

module.exports = router;
