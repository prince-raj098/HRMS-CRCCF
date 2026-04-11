const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentController');
const { protect, hrAdmin } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getDepts);
router.post('/', hrAdmin, ctrl.createDept);
router.put('/:id', hrAdmin, ctrl.updateDept);
router.delete('/:id', hrAdmin, ctrl.deleteDept);

module.exports = router;
