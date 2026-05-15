const path = require('path');
const Task = require('../models/Task');
const User = require('../models/User');
const tryCatch = require('../utils/tryCatch');
const {
  saveUploadedDocuments,
  removeTaskDirectory,
  removeDocumentFile,
} = require('../services/fileStorage');

const canViewTask = (task, user) => {
  if (!user) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  return task.createdBy.toString() === user._id.toString() || task.assignedTo?.toString() === user._id.toString();
};

const canManageTask = (task, user) => {
  if (!user) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  return task.createdBy.toString() === user._id.toString();
};

const buildTaskFilter = (req) => {
  const filter = {};
  const user = req.user;

  if (user.role !== 'admin') {
    filter.$or = [{ createdBy: user._id }, { assignedTo: user._id }];
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  if (req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  }
  if (req.query.search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ],
    });
  }

  if (req.query.dueBefore || req.query.dueAfter) {
    filter.dueDate = filter.dueDate || {};
    if (req.query.dueBefore) {
      filter.dueDate.$lte = new Date(req.query.dueBefore);
    }
    if (req.query.dueAfter) {
      filter.dueDate.$gte = new Date(req.query.dueAfter);
    }
  }

  return filter;
};

const serializeTask = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  createdBy: task.createdBy,
  assignedTo: task.assignedTo,
  documents: task.documents.map((document) => ({
    id: document._id,
    filename: document.filename,
    originalName: document.originalName,
    mimetype: document.mimetype,
    size: document.size,
    uploadedAt: document.uploadedAt,
  })),
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const listTasks = tryCatch(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const filter = buildTaskFilter(req);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', '_id email role')
      .populate('createdBy', '_id email role'),
    Task.countDocuments(filter),
  ]);

  return res.json({
    items: tasks.map(serializeTask),
    page,
    limit,
    total,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

const getTask = tryCatch(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', '_id email role')
    .populate('createdBy', '_id email role');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!canViewTask(task, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.json({ task: serializeTask(task) });
});

const createTask = tryCatch(async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo } = req.body;
  const incomingFiles = req.files || [];

  if (incomingFiles.length > 3) {
    return res.status(400).json({ message: 'Up to 3 documents are allowed' });
  }

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (assignedTo) {
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Assigned user not found' });
    }
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo: assignedTo || undefined,
    createdBy: req.user._id,
  });

  const savedDocuments = await saveUploadedDocuments(task._id, incomingFiles);
  task.documents = savedDocuments;
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', '_id email role')
    .populate('createdBy', '_id email role');

  if (req.app.get('io')) {
    req.app.get('io').emit('task:created', serializeTask(populatedTask));
  }

  return res.status(201).json({ task: serializeTask(populatedTask) });
});

const updateTask = tryCatch(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', '_id email role')
    .populate('createdBy', '_id email role');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!canManageTask(task, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { title, description, status, priority, dueDate, assignedTo } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate || undefined;

  if (assignedTo !== undefined) {
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }
      task.assignedTo = assignedTo;
    } else {
      task.assignedTo = undefined;
    }
  }

  const incomingFiles = req.files || [];
  if (task.documents.length + incomingFiles.length > 3) {
    return res.status(400).json({ message: 'Up to 3 documents are allowed per task' });
  }

  const savedDocuments = await saveUploadedDocuments(task._id, incomingFiles);
  task.documents.push(...savedDocuments);
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', '_id email role')
    .populate('createdBy', '_id email role');

  if (req.app.get('io')) {
    req.app.get('io').emit('task:updated', serializeTask(populatedTask));
  }

  return res.json({ task: serializeTask(populatedTask) });
});

const deleteTask = tryCatch(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!canManageTask(task, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await removeTaskDirectory(task._id);
  await Task.findByIdAndDelete(task._id);

  if (req.app.get('io')) {
    req.app.get('io').emit('task:deleted', { id: task._id });
  }

  return res.status(204).send();
});

const deleteTaskDocument = tryCatch(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!canManageTask(task, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const document = task.documents.id(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  await removeDocumentFile(document.path);
  document.deleteOne();
  await task.save();

  return res.status(204).send();
});

const viewTaskDocument = tryCatch(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!canViewTask(task, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const document = task.documents.id(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const fileName = path.basename(document.path);
  const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
  res.setHeader('Content-Type', document.mimetype);
  res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
  return res.sendFile(path.resolve(document.path));
});

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  deleteTaskDocument,
  viewTaskDocument,
  serializeTask,
  canManageTask,
  canViewTask,
};
