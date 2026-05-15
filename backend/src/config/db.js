const mongoose = require('mongoose');

const connectDatabase = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(mongoUri);
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDatabase, disconnectDatabase };
