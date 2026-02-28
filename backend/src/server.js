require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const { env } = require('./config/env');
const { initSocket } = require('./config/socket');
const { setupSocketHandlers } = require('./socket/handler');
const { setIO } = require('./socket/emitter');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initializeWorkers } = require('./jobs/workers');
const { setupScheduledJobs } = require('./jobs/scheduler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const listingRoutes = require('./routes/listing.routes');
const requestRoutes = require('./routes/request.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const aiRoutes = require('./routes/ai.routes');
const sponsoredRoutes = require('./routes/sponsored.routes');
const transactionRoutes = require('./routes/transaction.routes');
const notificationRoutes = require('./routes/notification.routes');
const mediaRoutes = require('./routes/media.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);

// ─── MIDDLEWARE ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow localhost in dev
        if (origin.startsWith('http://localhost')) return callback(null, true);
        // Allow any vercel.app domain
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        // Allow configured frontend URL
        if (origin === env.FRONTEND_URL) return callback(null, true);
        callback(null, true); // Allow all for now
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file serving for uploads (dev mode)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api', apiLimiter);

// ─── API ROUTES ──────────────────────────────────────────
const api = express.Router();
api.use('/auth', authRoutes);
api.use('/users', userRoutes);
api.use('/categories', categoryRoutes);
api.use('/listings', listingRoutes);
api.use('/requests', requestRoutes);
api.use('/deliveries', deliveryRoutes);
api.use('/ai', aiRoutes);
api.use('/sponsored', sponsoredRoutes);
api.use('/transactions', transactionRoutes);
api.use('/notifications', notificationRoutes);
api.use('/media', mediaRoutes);
api.use('/admin', adminRoutes);

app.use('/api/v1', api);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', name: 'ShareCare API', timestamp: new Date().toISOString() });
});

// ─── ERROR HANDLING ──────────────────────────────────────
app.use(errorHandler);

// ─── SOCKET.IO ───────────────────────────────────────────
const io = initSocket(server);
setIO(io);
setupSocketHandlers(io);

// ─── BACKGROUND JOBS ─────────────────────────────────────
try {
    initializeWorkers();
    setupScheduledJobs();
} catch (err) {
    console.warn('⚠️  Background jobs not started (Redis may be unavailable):', err.message);
}

// ─── START SERVER ────────────────────────────────────────
const PORT = env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║     ShareCare API Server                 ║
  ║     Running on port ${PORT}                  ║
  ║     Environment: ${env.NODE_ENV}          ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
