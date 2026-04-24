const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectController');
const { protect, hrAdmin } = require('../middleware/auth');

router.use(protect);
router.get('/my-projects', ctrl.getMyProjects);
router.get('/active-employees', ctrl.getActiveEmployeesOnProjects);
router.get('/', ctrl.getProjects);
router.get('/:id', ctrl.getProject);
router.post('/', hrAdmin, ctrl.createProject);
router.put('/:id', hrAdmin, ctrl.updateProject);
router.delete('/:id', hrAdmin, ctrl.deleteProject);
router.post('/:id/assign', hrAdmin, ctrl.assignEmployee);
router.delete('/:id/assign/:empId', hrAdmin, ctrl.removeEmployee);

module.exports = router;
