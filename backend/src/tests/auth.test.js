const request = require('supertest');
const User = require('../models/User');
const { setupTestApp, clearDatabase, teardownTestApp } = require('./testUtils');

describe('authentication flows', () => {
  let app;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  test('registers and logs in a user', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'member@example.com', password: 'secret123' });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe('member@example.com');
    expect(registerResponse.body.token).toBeDefined();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: 'secret123' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe('member@example.com');
    expect(loginResponse.body.token).toBeDefined();
  });

  test('returns the current user when authenticated', async () => {
    const user = await User.create({ email: 'profile@example.com', password: 'secret123', role: 'user' });
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'secret123' });

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe('profile@example.com');
  });
});
