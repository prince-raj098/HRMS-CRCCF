const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailController');
const { protect, hrAdmin } = require('../middleware/auth');

router.use(protect);
router.use(hrAdmin);

// POST /api/email/offer-letter  – send offer letter PDF to one employee
router.post('/offer-letter', ctrl.sendOfferLetter);

// POST /api/email/bulk  – send bulk emails to multiple employees
router.post('/bulk', ctrl.sendBulkEmail);

module.exports = router;
