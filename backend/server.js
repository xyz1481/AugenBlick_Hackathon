const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const whatsappRoutes = require('./routes/whatsappRoutes');
app.use('/api/whatsapp', whatsappRoutes);

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/live', require('./routes/liveFeedRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/simulator', require('./routes/simulationRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));
app.use('/api/intel', require('./routes/intelRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AugenBlick API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/augenblick';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Crash Guard for Hackathon Resilience
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

