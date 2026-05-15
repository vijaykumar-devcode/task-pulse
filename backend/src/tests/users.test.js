const request = require('supertest');
const User = require('../models/User');
const { setupTestApp, clearDatabase, teardownTestApp } = require('./testUtils');

describe('user management', () => {
  let app;
  let adminToken;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();
    const admin = await User.create({ email: 'admin@example.com', password: 'secret123', role: 'admin' });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'secret123' });
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  test('admin can create and list users', async () => {
    const createResponse = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newuser@example.com', password: 'secret123', role: 'user' });

    expect(createResponse.status).toBe(201);

    const listResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'newuser' });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
  });
});
