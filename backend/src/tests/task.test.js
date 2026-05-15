const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');
const User = require('../models/User');
const Task = require('../models/Task');
const { setupTestApp, clearDatabase, teardownTestApp } = require('./testUtils');

describe('task management', () => {
  let app;
  let adminToken;
  let memberToken;
  let memberUser;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();
    const admin = await User.create({ email: 'admin@example.com', password: 'secret123', role: 'admin' });
    memberUser = await User.create({ email: 'member@example.com', password: 'secret123', role: 'user' });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'secret123' });

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: memberUser.email, password: 'secret123' });

    adminToken = adminLogin.body.token;
    memberToken = memberLogin.body.token;
  });

  afterEach(async () => {
    await fs.rm(path.join(process.cwd(), 'uploads'), { recursive: true, force: true });
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  test('admin can create a task with a pdf document', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Ship assignment')
      .field('description', 'Finish the intern assignment')
      .field('status', 'todo')
      .field('priority', 'high')
      .field('assignedTo', memberUser._id.toString())
      .attach('documents', Buffer.from('%PDF-1.4\nTask document'), {
        filename: 'brief.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(201);
    expect(response.body.task.title).toBe('Ship assignment');
    expect(response.body.task.documents).toHaveLength(1);
  });

  test('member can only access owned tasks', async () => {
    const task = await Task.create({
      title: 'Member task',
      description: 'Assigned work',
      status: 'todo',
      priority: 'medium',
      createdBy: memberUser._id,
      assignedTo: memberUser._id,
    });

    const listResponse = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .query({ status: 'todo', sortBy: 'createdAt', sortOrder: 'desc' });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(task._id.toString());
  });

  test('task documents can be viewed through the protected endpoint', async () => {
    const task = await Task.create({
      title: 'Docs task',
      description: 'Has attachment',
      status: 'todo',
      priority: 'medium',
      createdBy: memberUser._id,
      assignedTo: memberUser._id,
    });

    const documentDirectory = path.join(process.cwd(), 'uploads', 'tasks', task._id.toString());
    await fs.mkdir(documentDirectory, { recursive: true });
    const documentPath = path.join(documentDirectory, 'doc.pdf');
    await fs.writeFile(documentPath, Buffer.from('%PDF-1.4\nProtected file'));

    task.documents = [
      {
        filename: 'doc.pdf',
        originalName: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 24,
        path: documentPath,
      },
    ];
    await task.save();

    const viewResponse = await request(app)
      .get(`/api/tasks/${task._id}/documents/${task.documents[0]._id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(viewResponse.status).toBe(200);
    expect(viewResponse.headers['content-type']).toContain('application/pdf');
  });
});
