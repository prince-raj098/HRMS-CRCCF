const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payrollController');
const { protect, hrAdmin } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getPayrolls);
router.post('/generate', hrAdmin, ctrl.generatePayroll);
router.put('/:id/pay', hrAdmin, ctrl.markAsPaid);
router.get('/:id/pdf', ctrl.downloadPayslip);

module.exports = router;
