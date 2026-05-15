const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../app');
const { connectDatabase, disconnectDatabase } = require('../config/db');

let mongoServer;

const setupTestApp = async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.CLIENT_URL = 'http://localhost:5173';
  await connectDatabase(mongoServer.getUri());
  return createApp();
};

const clearDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const teardownTestApp = async () => {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
};

module.exports = { setupTestApp, clearDatabase, teardownTestApp };
