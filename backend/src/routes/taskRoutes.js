const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');
const {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  deleteTaskDocument,
  viewTaskDocument,
} = require('../controllers/taskController');

const router = express.Router();

router.use(authenticate);

router.get('/', listTasks);
router.post('/', uploadDocuments, createTask);
router.get('/:id', getTask);
router.put('/:id', uploadDocuments, updateTask);
router.patch('/:id', uploadDocuments, updateTask);
router.delete('/:id', deleteTask);
router.delete('/:id/documents/:documentId', deleteTaskDocument);
router.get('/:id/documents/:documentId', viewTaskDocument);

module.exports = router;
