const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL || '',
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Postman) or from allowed list
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/federated', require('./routes/federated'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/remedies', require('./routes/remedies'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/expert', require('./routes/expert'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'Supabase',
  });
});

const createRealtimeServer = () => {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io — Real-time federated model updates
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-region', (region) => {
      socket.join(region);
      console.log(`📍 ${socket.id} joined region: ${region}`);
    });

    socket.on('federated-update', (data) => {
      io.emit('model-updated', {
        round: data.round,
        accuracy: data.accuracy,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  app.set('io', io);

  return { server, io };
};

if (process.env.VERCEL !== '1') {
  const { server } = createRealtimeServer();
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🌿 Federated Crop Disease Detector — Supabase Backend Ready');
    console.log(`⚡ Supabase: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ SUPABASE_URL missing!'}`);
  });
}

module.exports = app;
