const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');

const createApp = () => {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);

  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
