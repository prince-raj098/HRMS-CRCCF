const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');
const { protect, hrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getDocuments);
router.post('/', upload.single('file'), ctrl.uploadDocument);
router.put('/:id/verify', hrAdmin, ctrl.verifyDocument);
router.delete('/:id', hrAdmin, ctrl.deleteDocument);

module.exports = router;
