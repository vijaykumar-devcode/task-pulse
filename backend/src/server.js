require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const { connectDatabase } = require('./config/db');

const PORT = process.env.PORT || 5000;
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Connected to task updates' });
});

const start = async () => {
  await connectDatabase(process.env.MONGO_URI);
  server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { app, server, io, start };
